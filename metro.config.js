// metro.config.js
//
// Expo's Metro bundler skips Babel transformation for most node_modules
// by default (for speed). rn-tajweed-verse uses private class fields (#field)
// which Hermes cannot parse unless Babel transpiles them first.
// This file forces Metro to run Babel on that package.

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Packages that use modern JS syntax incompatible with Hermes out-of-the-box
const FORCE_TRANSFORM = ['rn-tajweed-verse'];

const forcePattern = FORCE_TRANSFORM.join('|');

config.transformer.transformIgnorePatterns = [
  `node_modules/(?!(${forcePattern}|react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|@react-native-async-storage/.*))`,
];

module.exports = config;
