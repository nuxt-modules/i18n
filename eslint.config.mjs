// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import typegen from 'eslint-typegen'
import perfectionist from 'eslint-plugin-perfectionist'

// @see reference https://github.com/nuxt/nuxt/blob/ec59aceeba3c9564ec0c3c2dfa5b468fbc464c10/eslint.config.mjs
export default createConfigForNuxt({
  features: {
    stylistic: {
      commaDangle: 'always-multiline',
    },
    tooling: true,
    typescript: true,
  },
})
  .prepend(
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
      ],
    },
    // for global and environment
    {
      languageOptions: {
        globals: {
          $fetch: 'readonly',
          NodeJS: 'readonly',
        },
      },
    },
  )

  .override('nuxt/javascript', {
    rules: {
      'curly': ['error', 'all'], // Including if blocks with a single statement
      'dot-notation': 'error',
      'logical-assignment-operators': ['error', 'always', { enforceForIfStatements: true }],
      'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],
      'no-lonely-if': 'error', // No single if in an "else" block
      'no-useless-rename': 'error',
      'object-shorthand': 'error',
      'prefer-const': ['error', { destructuring: 'any', ignoreReadBeforeAssign: false }],
      'require-await': 'error',
      'sort-imports': ['error', { ignoreDeclarationSort: true }],
    },
  })

  .override('nuxt/typescript/rules', {
    rules: {
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
        },
      ],
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '',
        },
      ],
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      ...{
        // TODO: Discuss if we want to enable this
        '@typescript-eslint/ban-types': 'off',
        // '@typescript-eslint/no-invalid-void-type': 'off',
      },
    },
  })

// Stylistic rules
  .override('nuxt/stylistic', {
    rules: {
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/indent-binary-ops': 'off',
      '@stylistic/max-statements-per-line': 'off',
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/quote-props': ['error', 'consistent'],
      '@stylistic/space-before-function-paren': ['error', { 'anonymous': 'always', 'asyncArrow': 'always', 'catch': 'always', 'named': 'never' }],
    },
  })

  .append(
    {
      rules: {
        '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'always' }],
        '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true }],
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            ignoreRestSiblings: true,
            varsIgnorePattern: '',
          },
        ],
        'jsdoc/empty-tags': ['off'],
      },
    },
    // Sort rule keys in eslint config
    {
      files: ['**/eslint.config.mjs'],
      name: 'local/sort-eslint-config',
      plugins: {
        perfectionist,
      },
      rules: {
        'perfectionist/sort-objects': 'error',
      },
    },
  )

  // Generate type definitions for the eslint config
  .onResolved(configs => typegen(configs))
