import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText } from '../helper'

describe('nuxt layers', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/basic_usage_layers`, import.meta.url)),
    browser: true,
    // overrides
    nuxtConfig: {}
  })

  test('basic usage', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    expect(await getText(page, '#vue-i18n-usage p')).toEqual('Hello World!')

    /**
     * change locale to `fr`
     */

    // click `fr` lang switch link (`setLocale`)
    // await page.locator('#lang-switcher-with-set-locale a').click()
    // await page.waitForTimeout(100)
    // expect(await getText(page, '#vue-i18n-usage p')).toEqual('Bonjour le monde!')
  })
})
