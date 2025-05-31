import { defineConfig } from 'vitest/config'
import vitestConfig from './vitest.config'
import { resolve } from 'pathe'

export default defineConfig({
  ...vitestConfig,
  test: {
    ...vitestConfig.test,
    setupFiles: [...(vitestConfig.test?.setupFiles ?? []), resolve('./test/setup.ts')].filter(Boolean),
    alias: {
      ...vitestConfig.test?.alias,
      '#build/i18n.options.mjs': resolve('./test/mocks/i18n.options.ts'),
      '#nuxt-i18n/logger': resolve('./test/mocks/i18n-logger.ts'),
      '#app': 'nuxt'
    }
  }
})
