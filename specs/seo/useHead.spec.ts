import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText, assetLocaleHead } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/use_head`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en',
      defaultDirection: 'auto'
    }
  }
})

test('render with useHead', async () => {
  const home = url('/')
  const page = await createPage()
  const logs: string[] = []
  page.on('console', msg => logs.push(msg.text()))
  await page.goto(home)

  /**
   * defautl locale
   */

  // title tag
  expect(await getText(page, 'title')).toMatch('Homepage')

  // html tag `lang` attriute
  expect(await page.getAttribute('html', 'lang')).toMatch('en')

  // html tag `dir` attriute
  expect(await page.getAttribute('html', 'dir')).toMatch('auto')

  // rendering link tag and meta tag in head tag
  await assetLocaleHead(page, '#home-use-locale-head')

  /**
   * change locale
   */

  // click `fr` lang switch link
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForTimeout(100)

  // title tag
  expect(await getText(page, 'title')).toMatch('Accueil')

  // html tag `lang` attriute
  expect(await page.getAttribute('html', 'lang')).toMatch('fr-FR')

  // rendering link tag and meta tag in head tag
  await assetLocaleHead(page, '#home-use-locale-head')
})
