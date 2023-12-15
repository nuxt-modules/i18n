import globals from 'globals'
import tsEsLintPlugin from '@typescript-eslint/eslint-plugin'
import tsEsLintParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'
import { FlatCompat } from '@eslint/eslintrc'
const compat = new FlatCompat()

export default [
  // Globals
  {
    files: ['**/*.js', '**/*.ts', '**/*.vue', '**/*.json'],
    ignores: [
      'dist',
      'playground',
      'specs/fixtures',
      'specs/utils',
      'test/fixtures',
      'coverage',
      'docs/components/content/Logo.vue',
      'docs/components/content/VoltaBoard.vue',
      'docs/components/AppHeader.vue',
      'docs/components/AppHeaderNavigation.vue',
      '.eslintcache',
      'src/runtime/templates'
    ],
    languageOptions: { globals: globals.node, parser: tsEsLintParser, parserOptions: { sourceType: 'module' } }
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
