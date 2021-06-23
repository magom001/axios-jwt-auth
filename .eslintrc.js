module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['prettier/react', 'airbnb-base', '@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars-experimental': 'error',
    'no-unused-vars': 'off',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts'],
      },
    },
  },
};
