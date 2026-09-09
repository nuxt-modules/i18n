import { defineConfig } from 'vitest/config'
import vitestConfig from './vitest.config'
import { resolve } from 'pathe'

export default defineConfig({
  ...vitestConfig,
  define: {
    'import.meta.client': 'true',
    'import.meta.server': 'false',
  },
  test: {
    ...vitestConfig.test,
    setupFiles: [...(vitestConfig.test?.setupFiles ?? []), resolve('./test/setup.ts')].filter(Boolean),
    alias: {
      ...vitestConfig.test?.alias,
      '#build/fetch': 'ofetch',
      '#build/i18n-h3.mjs': 'h3',
      '#build/i18n-options.mjs': resolve('./test/mocks/i18n.options.ts'),
      '#build/i18n-route-resources.mjs': resolve('./test/mocks/i18n.route-resources.ts'),
      '#internal/i18n-nitro.mjs': 'nitropack/runtime',
      '#app': 'nuxt',
      '#imports': resolve('./test/mocks/imports.ts'),
      // resolve from source - the package `imports` map points at `dist`, which may be stale
      '#i18n-kit': resolve('./src/runtime/kit'),
    },
  },
})
