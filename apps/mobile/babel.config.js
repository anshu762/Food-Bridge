module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // DO NOT use jsxImportSource: 'nativewind' here.
      // That enables react-native-css-interop's runtime JSX wrapper which
      // intercepts NavigationStateContext on Android and causes:
      //   "Couldn't find a navigation context" crash.
      // NativeWind v4's className support for RN core components works via
      // the metro config (withNativeWind) + nativewind/babel preset instead.
      'babel-preset-expo',
      'nativewind/babel',
    ],
    plugins: [
      'react-native-worklets-core/plugin',
    ],
  };
};
