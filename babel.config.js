module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // 👈 Yeh hamesha list ke end mein honi chahiye
    ],
  };
};