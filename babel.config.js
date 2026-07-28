module.exports = function(api) {
  api.cache(true);

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Strip all console calls in production builds except errors and
      // warnings — these are still useful in crash reports and Sentry.
      // In development (npx expo start) all console output is preserved.
      ...(isProduction
        ? [['transform-remove-console', { exclude: ['error', 'warn'] }]]
        : []),
    ],
  };
};