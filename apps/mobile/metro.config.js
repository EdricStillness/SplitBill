// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable web platform to avoid EXPO_ROUTER_APP_ROOT error
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android'],
};

module.exports = config;

