import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from './utils'
import { renderPage } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/empty_options`, import.meta.url)),
  browser: true
})

describe('inline options are handled correctly', async () => {
  test('inline options are handled correctly', async () => {
    const { page } = await renderPage('/')

    const text = await page.locator('#text-div').innerHTML()
    expect(text).toMatchInlineSnapshot(`"Hi from @nuxtjs/i18n: from the en locale"`)
  })
})
