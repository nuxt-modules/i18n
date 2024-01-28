import globals from 'globals'
import tsEsLintPlugin from '@typescript-eslint/eslint-plugin'
import tsEsLintParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'
import { FlatCompat } from '@eslint/eslintrc'
const compat = new FlatCompat()

export default [
  // Ignores
  {
    ignores: [
      '.eslintcache/**',
      'dist/**',
      'playground/**',
      'specs/fixtures/**',
      'specs/utils/**',
      'test/fixtures/**',
      'coverage/**',
      'src/runtime/templates/**',
      'docs/**'
    ]
  },

  // Globals
  {
    files: ['**/*.js', '**/*.ts', '**/*.vue', '**/*.json'],
    languageOptions: {
      globals: globals.node,
      parser: tsEsLintParser,
      parserOptions: { sourceType: 'module' }
    }
  },

  // Extends
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  ...compat.extends('plugin:@typescript-eslint/eslint-recommended'),
  eslintConfigPrettier,

  // TS Plugin
  {
    plugins: { '@typescript-eslint': tsEsLintPlugin },
    rules: { '@typescript-eslint/ban-ts-comment': 'off' }
  }
]
