module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      /**
       * jsxImportSource: 'nativewind' enables COMPILE-TIME className → style transform.
       * This is required on Android/iOS native to avoid the react-native-css-interop
       * runtime wrapper which intercepts NavigationStateContext and causes crashes.
       * react-native-css-interop must be installed explicitly (it is, in package.json)
       * so that the jsx-runtime can be resolved in the pnpm monorepo.
       */
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      'react-native-worklets-core/plugin',
    ],
  };
};

