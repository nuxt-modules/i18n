// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import typegen from 'eslint-typegen'
import perfectionist from 'eslint-plugin-perfectionist'

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
        // TODO: figure out how to get eslint to work in these files
        // eslint parsing errors in these files, possibly due to generated tsconfig in .nuxt?
        'src/runtime/server',
        'src/runtime/composables/server.ts',
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
  .append(
    {
      rules: {
        '@typescript-eslint/no-empty-object-type': [
          'error',
          { allowInterfaces: 'always' },
        ],
        '@typescript-eslint/no-unused-expressions': [
          'error',
          { allowShortCircuit: true },
        ],
        // '@typescript-eslint/no-unnecessary-type-assertion': ['warn', {}],
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            args: 'all',
            argsIgnorePattern: '^_',
            caughtErrors: 'all',
            caughtErrorsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            ignoreRestSiblings: true,
            varsIgnorePattern: '^_',
          },
        ],
        'jsdoc/empty-tags': ['off'],
      },
    },
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
    // override rules
    {
      rules: { '@typescript-eslint/ban-ts-comment': 'off' },
    },
  )

  // Generate type definitions for the eslint config
  .onResolved(configs => typegen(configs))
