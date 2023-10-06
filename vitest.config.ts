import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 300000,
    retry: 1,
    server: {
      deps: {
        inline: [/@nuxt\/test-utils/]
      }
    },
    setupFiles: ['./specs/utils/setup-env.ts'],
    exclude: [...configDefaults.exclude],
    maxThreads: process.env.CI ? undefined : 4,
    minThreads: process.env.CI ? undefined : 4
  }
})
