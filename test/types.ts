import type { Listener } from 'listhen'
import type { Page, Browser } from 'playwright-chromium'

export type NitroContext = {
  rootDir?: string
  outDir?: string
  fetch?: (url: string) => Promise<unknown>
  server?: Listener
  browser?: Browser
  page?: Page
}
