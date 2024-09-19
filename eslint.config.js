import globals from 'globals'
import js from '@eslint/js'
import ts from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

/**
 * @typedef {import("eslint").Linter.FlatConfig[]} FlatConfigs
 */

/** @type { FlatConfigs } */
export default [
  // ignores
  {
    ignores: [
      '.nuxt',
      'dist',
      'playground',
      'specs',
      'test',
      'coverage',
      'docs',
      // TODO: figure out how to get eslint to work in these files
      // eslint parsing errors in these files, possibly due to generated tsconfig in .nuxt?
      'src/runtime/server',
      'src/runtime/composables/server.ts'
    ]
  },

  // for global and environment
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      }
    }
  },

  // eslint built-in
  js.configs.recommended,

  // typescript-eslint
  ...ts.configs.recommendedTypeChecked,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        sourceType: 'module',
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ]
    }
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    ...ts.configs.disableTypeChecked
  },

  // prettier
  eslintConfigPrettier,

  // override rules
  {
    rules: { '@typescript-eslint/ban-ts-comment': 'off' }
  }
]
