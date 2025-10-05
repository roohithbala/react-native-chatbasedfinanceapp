const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle react-native-webrtc imports
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Handle event-target-shim import issues
    if (moduleName === 'event-target-shim/index') {
      return {
        filePath: require.resolve('event-target-shim/dist/event-target-shim.js'),
        type: 'sourceFile',
      };
    }
    // Call the default resolver for other modules
    return context.resolveRequest(context, moduleName, platform);
  },
  extraNodeModules: {
    'event-target-shim': require.resolve('event-target-shim'),
  },
};

module.exports = config;