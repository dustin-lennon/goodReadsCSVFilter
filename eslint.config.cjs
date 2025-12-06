const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettierPlugin = require('eslint-plugin-prettier');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    ignores: [
      'dist/**',
      'dist-executable/**',
      'node_modules/**',
      'coverage/**',
      'src/gui/renderer.js',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: Object.assign(
      {},
      tsPlugin.configs.recommended.rules,
      {
        'prettier/prettier': 'error',
        '@typescript-eslint/no-require-imports': 'off',
      },
    ),
  },
];

