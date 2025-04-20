const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project root directory
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Optimize the resolver
config.resolver.blockList = [/\.git\/.*/];
config.resolver.extraNodeModules = new Proxy({}, {
  get: (target, name) => {
    return path.join(projectRoot, `node_modules/${name}`);
  }
});

// Removed minifierPath and minifierConfig to use default minification

// Configuration for the asset system
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// Add specific extensions for SVG and other assets
const { assetExts, sourceExts } = config.resolver;
config.resolver.assetExts = assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...sourceExts, 'svg'];

// Enable RAM bundles for Android and iOS
config.serializer = {
  ...config.serializer,
  createModuleIdFactory: () => {
    const fileToIdMap = new Map();
    let nextId = 0;
    return path => {
      if (fileToIdMap.has(path)) {
        return fileToIdMap.get(path);
      }
      const id = nextId++;
      fileToIdMap.set(path, id);
      return id;
    };
  },
};

module.exports = config;
