// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import typegen from 'eslint-typegen'
import perfectionist from 'eslint-plugin-perfectionist'

const restrictedFetch = { message: 'Use `useRequestFetch()` instead.', name: '$fetch' }
const restrictedFlags = [
  '__I18N_DOMAINS__',
  '__I18N_STRATEGY__',
  '__I18N_ROUTING__',
  '__TRAILING_SLASH__',
  '__I18N_STRICT_SEO__',
  '__I18N_COMPACT_ROUTES__',
].map(name => ({ message: 'Pass the flag through the factory config, flags are read at composition points.', name }))

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
        'playground-v5',
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
    // `#build/fetch` only exports `$fetch` since Nuxt 4.5, and Nuxt 5 no longer defines the global in the app
    {
      files: ['src/runtime/**'],
      ignores: ['src/runtime/server/**'],
      name: 'local/no-ambient-fetch',
      rules: {
        'no-restricted-globals': ['error', restrictedFetch],
        'no-restricted-imports': ['error', { message: 'Use `useRequestFetch()` instead.', name: '#build/fetch' }],
      },
    },
    // The parameterized routing/detection layer receives flags as config, reads live at composition points.
    // A later block replaces the options of a rule, so the `$fetch` restriction is repeated here
    {
      files: [
        'src/runtime/kit/**',
        'src/runtime/routing/context.ts',
        'src/runtime/routing/domain.ts',
        'src/runtime/routing/head.ts',
        'src/runtime/routing/navigation.ts',
        'src/runtime/routing/utils.ts',
        'src/runtime/shared/detection.ts',
        'src/runtime/shared/domain.ts',
      ],
      name: 'local/no-flag-reads',
      rules: {
        'no-restricted-globals': ['error', restrictedFetch, ...restrictedFlags],
      },
    },
    {
      files: ['src/runtime/server/utils/redirect.ts'],
      name: 'local/no-flag-reads/server',
      rules: {
        'no-restricted-globals': ['error', ...restrictedFlags],
      },
    },
    // While plugins are set up `useNuxtApp()` can resolve another request's app (#4148), code running
    // there reads from the Nuxt app it is given instead of looking one up
    {
      files: [
        'src/runtime/plugins/**',
        'src/runtime/composable-context.ts',
        'src/runtime/context.ts',
        'src/runtime/routing/domain.ts',
        'src/runtime/utils.ts',
      ],
      name: 'local/no-ambient-app',
      rules: {
        'no-restricted-imports': ['error', {
          paths: [
            { message: 'Use `useRequestFetch()` instead.', name: '#build/fetch' },
            ...['#imports', '#app'].map(name => ({
              importNames: ['useNuxtApp', 'useRoute', 'useRouter'],
              message: 'Take the Nuxt app as an argument and read from it instead.',
              name,
            })),
          ],
        }],
        'no-restricted-syntax': ['error', {
          message: 'Pass the Nuxt app, `useRequestEvent(nuxtApp)`.',
          selector: 'CallExpression[callee.name="useRequestEvent"][arguments.length=0]',
        }],
      },
    },
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
    // @ts-ignore type issues with eslint
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
