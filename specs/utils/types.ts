import type { Nuxt, NuxtConfig } from '@nuxt/schema'
import type { ExecaChildProcess } from 'execa'
import type { Browser, LaunchOptions } from 'playwright'
import type { NuxtI18nOptions } from '../../src/types'

export type TestRunner = 'vitest' | 'jest'

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
  runner: TestRunner
  logLevel: number
  browserOptions: {
    type: 'chromium' | 'firefox' | 'webkit'
    launch?: LaunchOptions
  }
  server: boolean
  port?: number
}

export interface TestContext {
  options: TestOptions
  nuxt?: Nuxt
  browser?: Browser
  url?: string
  serverProcess?: ExecaChildProcess
  // eslint-disable-next-line @typescript-eslint/ban-types
  mockFn?: Function
}

export interface TestHooks {
  beforeEach: () => void
  afterEach: () => void
  afterAll: () => void
  setup: () => void
  ctx: TestContext
}
