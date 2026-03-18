module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  extends: ['universe/native'],
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: ['babel-preset-expo'],
    },
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'import/order': 'off',
  },
};
