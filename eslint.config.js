import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

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
      'docs/.output/**',
      'docs/.nuxt/**',
      'docs/components/content/Logo.vue',
      'docs/components/content/VoltaBoard.vue',
      'docs/components/AppHeader.vue',
      'docs/components/AppHeaderNavigation.vue'
    ]
  },

  // Globals
  {
    files: ['**/*.js', '**/*.ts', '**/*.vue', '**/*.json'],
    languageOptions: {
      globals: globals.node,
      parserOptions: { sourceType: 'module' }
    }
  },

  // Extends
  ...tseslint.configs.recommended,
  eslintConfigPrettier,

  // Rules
  {
    rules: { '@typescript-eslint/ban-ts-comment': 'off' }
  }
]
