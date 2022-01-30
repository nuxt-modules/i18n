import { beforeAll, afterAll } from 'vitest'
import createDebug from 'debug'
import { chromium } from 'playwright-chromium'
import { readNitroContextInfo } from '../utils'

import type { NitroContext } from '../types'

const debug = createDebug('vitest:setup')

beforeAll(async () => {
  debug('setup browser')

  // read nitro context info from global setup
  const ctx = (await readNitroContextInfo()) as NitroContext
  ;(globalThis as any).NITRO_CONTEXT = ctx // eslint-disable-line @typescript-eslint/no-explicit-any

  const browser = await chromium.launch()
  const page = await browser.newPage()

  // set playwright browser and page to nitro context
  ctx.browser = browser
  ctx.page = page
})

afterAll(async () => {
  debug('teardown browser')
  const ctx = (globalThis as any).NITRO_CONTEXT as NitroContext // eslint-disable-line @typescript-eslint/no-explicit-any
  ctx.page && (await ctx.page.close())
  ctx.browser && (await ctx.browser.close())
})
