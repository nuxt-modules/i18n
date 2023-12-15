import tsEsLintPlugin from '@typescript-eslint/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'

// extends: ['plugin:@typescript-eslint/recommended', 'plugin:@typescript-eslint/eslint-recommended', 'prettier']

export default [
  // Globals
  {
    env: { node: true },
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
