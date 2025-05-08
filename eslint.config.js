import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up compatibility layer to use eslint:recommended and eslint:all
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  // Ignore seed scripts entirely
  { ignores: ['src/scripts/**/*.js'] },
  // Equivalent to "extends: 'eslint:recommended'"
  ...compat.extends('eslint:recommended'),
  // Equivalent to env: { node: true, es2021: true, jest: true }
  ...compat.env({
    node: true,
    es2021: true,
    jest: true,
  }),
  {
    // Apply to your JS source and test files
    files: ['src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
      globals: {
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'warn',
    },
  },
];
