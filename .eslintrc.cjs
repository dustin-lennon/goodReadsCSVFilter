module.exports = {
  root: true,
  env: {
    node: true,
    es2024: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'prettier/prettier': 'error',
  },
  ignorePatterns: ['dist', 'dist-executable', 'node_modules', 'coverage'],
};


