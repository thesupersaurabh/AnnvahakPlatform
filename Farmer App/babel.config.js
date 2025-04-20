module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Only include what's needed for the platform
      ['transform-react-remove-prop-types', { removeImport: true }],
      // Tree-shaking for production builds
      process.env.NODE_ENV === 'production' && [
        'transform-remove-console',
        { exclude: ['error', 'warn'] },
      ],
      // For Expo Router
      'react-native-reanimated/plugin',
    ].filter(Boolean),
  };
}; 