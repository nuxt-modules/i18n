import { defineConfig } from 'vitest/config'
import vitestConfig from './vitest.config'
import { resolve } from 'pathe'

export default defineConfig({
  ...vitestConfig,
  test: {
    ...vitestConfig.test,
    alias: {
      ...(vitestConfig.test?.alias ?? {}),
      '#build/i18n.options.mjs': resolve('./test/options-mock.ts'),
      '#app': 'nuxt'
    }
  }
})
