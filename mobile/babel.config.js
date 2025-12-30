module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // 'react-native-reanimated/plugin', // Temporaneamente disabilitato - richiede worklets
    // module-resolver temporaneamente disabilitato per test Expo Go SDK 54
    // [
    //   'module-resolver',
    //   {
    //     root: ['./src'],
    //     extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
    //     alias: {
    //       '@': './src',
    //       '@api': './src/api',
    //       '@components': './src/components',
    //       '@screens': './src/screens',
    //       '@navigation': './src/navigation',
    //       '@hooks': './src/hooks',
    //       '@utils': './src/utils',
    //       '@config': './src/config',
    //       '@types': './src/types',
    //       '@assets': './src/assets',
    //     },
    //   },
    // ],
  ],
};
