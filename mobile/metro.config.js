/**
 * Metro configuration for Expo
 * https://docs.expo.dev/guides/customizing-metro/
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Aggiungi supporto per .cjs
config.resolver.sourceExts.push('cjs');

// Fix per errore "Property 'require' doesn't exist" - SDK 53/54
// Ref: https://github.com/expo/expo/issues/36551
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
