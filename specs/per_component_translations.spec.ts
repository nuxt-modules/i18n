import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/switcher`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en'
    }
  }
})

/**
 * NOTE:
 *  i18n custom block does not build correctly on nuxt/test-utils,
 *  so I disable it once. playground confirms that it works for me.
 */
test.skip('i18n custom block', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  // click `fr` lang switch with `<NuxtLink>`
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForTimeout(1000)

  // go to category page
  await page.locator('#link-category').click()
  await page.waitForTimeout(1000)

  console.log(await page.content())
  console.log(await page.url())
  expect(await getText(page, '#per-component-hello')).toMatch('Bonjour!')

  // click `en` lang switch with `<NuxtLink>`
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForTimeout(1000)

  expect(await getText(page, '#per-component-hello')).toMatch('Hello!')
})
