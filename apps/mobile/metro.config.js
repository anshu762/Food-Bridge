const { getDefaultConfig } = require('expo/metro-config');

// NativeWind v2: no withNativeWind wrapper needed.
// The babel plugin handles className → StyleSheet transforms at compile time.
// expo/metro-config already handles CSS for web via its own transformer.
const config = getDefaultConfig(__dirname);

module.exports = config;
