import tsEsLintPlugin from '@typescript-eslint/eslint-plugin'
import tsEsLintParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  // Globals
  {
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
    env: { node: true },
    languageOptions: { parser: tsEsLintParser },
    parserOptions: { sourceType: 'module' }
  },

  // Extends
  ...tsEsLintPlugin.configs['recommended'].rules,
  ...tsEsLintPlugin.configs['eslint-recommended'],
  eslintConfigPrettier,

  // TS Plugin
  {
    plugins: { '@typescript-eslint': tsEsLintPlugin },
    rules: { '@typescript-eslint/ban-ts-comment': 'off' }
  }
]
