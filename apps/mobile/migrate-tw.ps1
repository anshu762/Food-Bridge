$ErrorActionPreference = "Continue"

$files = Get-ChildItem -Path "apps/mobile/app/(donor)","apps/mobile/app/(receiver)","apps/mobile/app/(admin)","apps/mobile/src/components/listings" -Recurse -Filter "*.tsx"

foreach ($f in $files) {
    $lines = Get-Content -LiteralPath $f.FullName
    $content = $lines -join "`n"
    
    if (-not ($content -match 'className')) {
        continue
    }

    Write-Output "Migrating: $($f.FullName | Split-Path -Leaf)"
    
    # Determine import depth
    $depth = "../../src/utils/tw"
    if ($f.FullName -match "\\components\\") {
        $depth = "../../utils/tw"
    }
    
    # Remove cn import
    $content = $content -replace "import \{ cn \} from '[^']+cn';\n?", ""
    
    # Add tw import after last import if not present
    if (-not ($content -match "import tw from")) {
        $insertLine = "import tw from '$depth';"
        $splitLines = $content -split "`n"
        $lastImportIdx = 0
        for ($i = 0; $i -lt $splitLines.Length; $i++) {
            if ($splitLines[$i] -match "^import ") {
                $lastImportIdx = $i
            }
        }
        $before = $splitLines[0..$lastImportIdx] -join "`n"
        $after = $splitLines[($lastImportIdx+1)..($splitLines.Length-1)] -join "`n"
        $content = $before + "`n" + $insertLine + "`n" + $after
    }
    
    # Replace className="..." with style={tw`...`}
    $content = $content -replace 'className="([^"]*)"', 'style={tw`$1`}'
    
    # Replace className={`...`} with style={tw`...`}
    $content = $content -replace 'className=\{`([^`]*)`\}', 'style={tw`$1`}'
    
    Set-Content -LiteralPath $f.FullName -Value $content -NoNewline
}

Write-Output "Migration complete!"
