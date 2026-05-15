// @ts-check
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

const compat = new FlatCompat({ baseDirectory: __dirname });

/** @type {import('typescript-eslint').Config} */
const baseConfig = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '.next/**', 'coverage/**'],
  },
);

module.exports = baseConfig;
