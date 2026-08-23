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
      '#build/i18n-route-resources.mjs': resolve('./test/mocks/i18n.route-resources.ts'),
      '#internal/nuxt.config.mjs': resolve('./test/mocks/nuxt.internal-config.ts'),
      '#internal/i18n-locale-detector.mjs': resolve('./test/mocks/i18n.locale-detector.ts'),
      '#app': 'nuxt',
      '#imports': resolve('./test/mocks/imports.ts'),
      // resolve from source - the package `imports` map points at `dist`, which may be stale
      '#i18n-kit': resolve('./src/runtime/kit'),
    },
  },
})
