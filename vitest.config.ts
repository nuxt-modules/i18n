/// <reference types="vitest" />
import { defineConfig } from 'vite'

type TestType = 'unit' | 'e2e'

const TEST_TYPE: TestType = (process.env.TEST_TYPE as TestType) || 'unit'

export default defineConfig({
  test: {
    global: true,
    setupFiles: TEST_TYPE === 'unit' ? [] : ['./test/setup/browser.ts'],
    globalSetup: TEST_TYPE === 'unit' ? [] : ['./test/setup/build.ts'],
    testTimeout: 5000
  }
})
