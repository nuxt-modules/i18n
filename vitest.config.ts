import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 60000,
    hookTimeout: 30000,
    // Disable stderr in tests to silence the noise.
    onConsoleLog (_log, type) {
      if (type === 'stderr') {
        return false
      }
    }
  }
})
