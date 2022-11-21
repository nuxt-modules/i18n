import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText, getData } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en',
      parsePages: false,
      pages: {
        about: {
          fr: '/about-fr'
        },
        blog: {
          en: '/news'
        },
        'blog/article': {
          en: '/news/article'
        }
      }
    }
  }
})

test('can access to custom route path', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForTimeout(100)

  // page path
  expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/fr/about-fr' })

  // navigate to about page for `fr`
  await page.locator('#link-about').click()
  await page.waitForTimeout(100)

  expect(await getText(page, '#about-header')).toEqual('À propos')
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
  expect(await page.url()).include('/fr/about-fr')
})

test('can access to custom nested route path', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  // navigate to blog index page
  await page.locator('#link-blog').click()
  await page.waitForTimeout(100)

  expect(await page.url()).include('/news')

  // navigate to blog article page
  await page.locator('#link-blog-article').click()
  await page.waitForTimeout(100)

  expect(await page.url()).include('/news/article')
})
