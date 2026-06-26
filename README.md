# Food Bridge

Bridging surplus. Nourishing lives.

A food donation matching platform connecting donors with receivers through
local organizations.

## Prerequisites

- Node.js >= 18
- pnpm >= 9
- PostgreSQL (NeonDB)

## Getting Started

```bash
# Install all dependencies
pnpm install

# Set up environment variables
cp apps/backend/.env.example apps/backend/.env
```

### Backend

```bash
cd apps/backend
pnpm dev
```

Server starts at http://localhost:3001. Health check: GET /health.

### Mobile

```bash
cd apps/mobile
pnpm dev
```

Scan the QR code with Expo Go, or press `a` for Android / `i` for iOS.

### Shared Package

`@food-bridge/shared` is available to both apps via workspace protocol.
Import shared types and Zod schemas:

```ts
import { LoginSchema, type User } from '@food-bridge/shared';
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps in dev mode |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm format` | Format all files |

## Tech Stack

- **Backend**: Express.js + Prisma + NeonDB (PostgreSQL)
- **Mobile**: React Native + Expo + NativeWind + Expo Router
- **Shared**: Zod + TypeScript
- **Monorepo**: pnpm workspaces
