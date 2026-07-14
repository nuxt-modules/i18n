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
      '#build/i18n-options.mjs': resolve('./test/mocks/i18n.options.ts'),
      '#app': 'nuxt',
      '#imports': resolve('./test/mocks/imports.ts'),
      // resolve from source - the package `imports` map points at `dist`, which may be stale
      '#i18n-kit': resolve('./src/runtime/kit'),
    },
  },
})
