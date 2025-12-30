/**
 * Metro configuration for Expo
 * https://docs.expo.dev/guides/customizing-metro/
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Aggiungi supporto per .cjs
config.resolver.sourceExts.push('cjs');

module.exports = config;
