module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind v2: babel-preset-expo runs first (no jsxImportSource needed).
      // The 'nativewind/babel' PLUGIN (not preset) transforms className → style
      // at compile time — no runtime wrapper, no css-interop, no navigation crashes.
      'babel-preset-expo',
    ],
    plugins: [
      // NativeWind v2: compile-time className → StyleSheet transform
      'nativewind/babel',
      // Required for react-native-reanimated v4 worklets
      'react-native-worklets-core/plugin',
    ],
  };
};
