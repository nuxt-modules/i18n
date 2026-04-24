import type { Nuxt, NuxtConfig } from '@nuxt/schema'
import type { exec } from 'tinyexec'
import type { Browser, LaunchOptions } from 'playwright-core'
import type { NuxtI18nOptions } from '../../src/types'
import type { Suite, File } from 'vitest'

export type TestServerProcess =
  | ReturnType<typeof exec>
  | { kill: () => void | Promise<void> }

export interface TestOptions {
  testDir: string
  fixture: string
  configFile: string
  rootDir: string
  buildDir: string
  nuxtConfig: NuxtConfig & { i18n?: NuxtI18nOptions }
  build: boolean
  dev: boolean
  prerender: boolean // NOTE: this option for `nuxi generate` emulation
  setupTimeout: number
  waitFor: number
  browser: boolean
  runner: 'vitest'
  logLevel: number
  browserOptions: {
    type: 'chromium' | 'firefox' | 'webkit'
    launch?: LaunchOptions
  }
  server: boolean
  port?: number | number[]
}

export interface TestContext {
  options: TestOptions
  nuxt?: Nuxt
  browser?: Browser
  url?: string
  serverProcess?: TestServerProcess
  // eslint-disable-next-line @typescript-eslint/ban-types
  mockFn?: Function
  /**
   * Functions to run on the vitest `afterAll` hook.
   * Useful for removing anything created during the test.
   */
  teardown?: (() => void)[]
}

export interface TestHooks {
  beforeEach: () => void
  afterEach: () => void
  afterAll: () => void | Promise<void>
  setup: (testContext: VitestContext) => void
  ctx: TestContext
}

export type VitestContext = Suite | File
