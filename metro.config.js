const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle react-native-webrtc imports
config.resolver = {
  ...config.resolver,
  alias: {
    'event-target-shim/index': require.resolve('event-target-shim/dist/event-target-shim.js'),
  },
  extraNodeModules: {
    'event-target-shim': require.resolve('event-target-shim'),
  },
};

module.exports = config;