import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    threads: false,
    testTimeout: 300000,
    deps: {
      inline: [/@nuxt\/test-utils-edge/]
    }
  }
})
