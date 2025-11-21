const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle react-native-webrtc imports and date-fns
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
    // Handle date-fns locale imports that have .js extensions
    if (moduleName.includes('date-fns/locale/') && moduleName.endsWith('.js')) {
      const moduleWithoutExtension = moduleName.replace('.js', '');
      try {
        return context.resolveRequest(context, moduleWithoutExtension, platform);
      } catch (e) {
        // If that fails, try to resolve it directly
        return {
          filePath: require.resolve(moduleWithoutExtension),
          type: 'sourceFile',
        };
      }
    }
    // Call the default resolver for other modules
    return context.resolveRequest(context, moduleName, platform);
  },
  extraNodeModules: {
    'event-target-shim': require.resolve('event-target-shim'),
  },
  // Add sourceExts to handle .js files properly
  sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
};

module.exports = config;