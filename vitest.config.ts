import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 300000,
    retry: process.env.CI ? 1 : 0,
    server: {
      deps: {
        inline: [/@nuxt\/test-utils/],
      },
    },
    setupFiles: ['./specs/utils/setup-env.ts'],
    exclude: [...configDefaults.exclude],
    poolOptions: {
      forks: {
        maxForks: process.env.CI ? undefined : 4,
        minForks: process.env.CI ? undefined : 4,
      },
    },
  },
  resolve: {
    alias: {
      '#imports': 'nuxt',
    },
  },
})
