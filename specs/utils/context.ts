import { resolve } from 'node:path'
import { defu } from 'defu'
import type { TestContext, TestOptions } from './types'
import { LaunchOptions } from 'playwright-core'

let currentContext: TestContext | undefined

export function createTestContext(options: Partial<TestOptions>): TestContext {
  const _options: Partial<TestOptions> = defu(options, {
    testDir: resolve(process.cwd(), 'test'),
    fixture: 'fixture',
    configFile: 'nuxt.config',
    setupTimeout: 120 * 1000,
    dev: !!JSON.parse(process.env.NUXT_TEST_DEV || 'false'),
    prerender: options.prerender ?? false,
    logLevel: 1,
    server: true,
    build: options.browser !== false || options.server !== false,
    nuxtConfig: {},
    // TODO: auto detect based on process.env
    runner: 'vitest' as const,
    browserOptions: {
      type: 'chromium' as const,
      launch: {} satisfies LaunchOptions
    }
  })

  return setTestContext({
    options: _options as TestOptions
  })
}

export function useTestContext(): TestContext {
  recoverContextFromEnv()
  if (!currentContext) {
    throw new Error('No context is available. (Forgot calling setup or createContext?)')
  }
  return currentContext
}

export function setTestContext(context: TestContext): TestContext
export function setTestContext(context?: TestContext): TestContext | undefined
export function setTestContext(context?: TestContext): TestContext | undefined {
  currentContext = context
  return currentContext
}

function recoverContextFromEnv() {
  if (!currentContext && process.env.NUXT_TEST_CONTEXT) {
    setTestContext(JSON.parse(process.env.NUXT_TEST_CONTEXT || '{}'))
  }
}
