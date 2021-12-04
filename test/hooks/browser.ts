import createDebug from 'debug'
import { chromium } from 'playwright-chromium'

import type { NitroContext } from '../types'

const debug = createDebug('mocha:hooks:browser')

export const mochaHooks = {
  async beforeAll() {
    debug('mocha:hooks:browser:beforeAll')
    const browser = await chromium.launch()
    const page = await browser.newPage()

    // set playwright browser and page to nitro context
    const ctx = (globalThis as any).NITRO_CXT as NitroContext // eslint-disable-line @typescript-eslint/no-explicit-any
    ctx.browser = browser
    ctx.page = page
  },
  async afterAll() {
    debug('mocha:hooks:browser:afterAll')
    const ctx = (globalThis as any).NITRO_CXT as NitroContext // eslint-disable-line @typescript-eslint/no-explicit-any
    ctx.page && (await ctx.page.close())
    ctx.browser && (await ctx.browser.close())
  },
  beforeEach() {
    debug('mocha:hooks:browser:beforeEach')
  },
  afterEach() {
    debug('mocha:hooks:browser:afterEach')
  }
}
