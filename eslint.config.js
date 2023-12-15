import tsEsLintPlugin from '@typescript-eslint/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  // Globals
  {
    env: { node: true },
    parserOptions: { sourceType: 'module' }
  },

  // Extends
  ...tsEsLintPlugin.configs['recommended'].rules,
  ...tsEsLintPlugin.configs['eslint-recommended'],
  eslintConfigPrettier
]
