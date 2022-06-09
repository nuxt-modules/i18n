/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    testTimeout: 300000,
    deps: {
      inline: [/@nuxt\/test-utils-edge/]
    }
  }
})
