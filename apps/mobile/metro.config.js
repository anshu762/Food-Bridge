const { getDefaultConfig } = require('expo/metro-config');

// Plain metro config — no NativeWind/css-interop wrappers.
// Styling is handled by twrnc (pure JS, no runtime hooks).
const config = getDefaultConfig(__dirname);

module.exports = config;
