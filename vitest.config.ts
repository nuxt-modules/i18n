import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 300000,
    // the default of 10s is too short for hooks building an app or tearing down a server on a slow runner
    hookTimeout: 120000,
    retry: process.env.CI ? 1 : 0,
    server: {
      deps: {
        inline: [/@nuxt\/test-utils/],
      },
    },
    setupFiles: ['./specs/utils/setup-env.ts'],
    exclude: [...configDefaults.exclude, '**/*.config.*'],
    maxWorkers: process.env.CI ? undefined : 4,
  },
  resolve: {
    alias: {
      '#imports': 'nuxt',
    },
  },
})
