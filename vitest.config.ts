import { defineConfig } from 'vitest/config'

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
    }
  }
})
