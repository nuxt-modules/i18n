import type { Listener } from 'listhen'
import type { Page, Browser } from 'playwright-chromium'

export type EnvMode = 'production' | 'development'
export type FixtureMode = 'bridge' | 'nuxt3'
export type NitroContextInfo = {
  rootDir: string
  buildDir: string
  outDir: string
  fixture: FixtureMode
  preset: string
  env: EnvMode
}

export type NitroContext = {
  fetch?: (url: string) => Promise<unknown>
  server?: Listener
  browser?: Browser
  page?: Page
} & Partial<NitroContextInfo>
