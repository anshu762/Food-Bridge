module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource is intentionally NOT set here.
      // In a pnpm monorepo, 'nativewind' cannot hoist react-native-css-interop
      // reliably. The 'nativewind/babel' preset handles className -> style transforms.
      'babel-preset-expo',
      'nativewind/babel',
    ],
    plugins: [
      'react-native-worklets-core/plugin',
    ],
  };
};
