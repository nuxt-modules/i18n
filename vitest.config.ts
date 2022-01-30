/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    global: true,
    setupFiles: ['./test/setup/browser.ts'],
    globalSetup: ['./test/setup/build.ts'],
    testTimeout: 5000
  }
})
