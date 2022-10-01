import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText, assetLocaleHead } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/head`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en'
    }
  }
})

test('render with meta components', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  /**
   * defautl locale
   */

  // title tag
  expect(await getText(page, 'title')).toMatch('Page - Homepage')

  // html tag `lang` attriute
  expect(await page.getAttribute('html', 'lang')).toMatch('en')

  // html tag `dir` attriute
  expect(await page.getAttribute('html', 'dir')).toMatch('ltr')

  // rendering link tag and meta tag in head tag
  await assetLocaleHead(page, '#home-use-locale-head')

  /**
   * change locale
   */

  // click `fr` lang switch link
  await page.locator('#lang-switcher-with-nuxt-link a').click()

  // title tag
  expect(await getText(page, 'title')).toMatch('Page - Accueil')

  // html tag `lang` attriute
  expect(await page.getAttribute('html', 'lang')).toMatch('fr-FR')

  // rendering link tag and meta tag in head tag
  await assetLocaleHead(page, '#home-use-locale-head')

  /**
   * access to other page
   */

  // click about page
  await page.locator('#link-about').click()

  // title tag
  expect(await getText(page, 'title')).toMatch('Page - À propos')

  // html tag `lang` attriute
  expect(await page.getAttribute('html', 'lang')).toMatch('fr-FR')

  // rendering link tag and meta tag in head tag
  await assetLocaleHead(page, '#home-use-locale-head')
})
