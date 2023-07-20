import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/browser_language_detection/redirect_no_prefix`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'prefix_and_default',
      detectBrowserLanguage: {
        alwaysRedirect: false,
        redirectOn: 'no prefix'
      }
    }
  }
})

test('redirectOn: no prefix', async () => {
  const blog = url('/blog/article')
  const page = await createPage(undefined, { locale: 'fr' }) // set browser locale
  await page.goto(blog)

  // detect locale from navigator language
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // click `en` lang switch link
  await page.locator('#set-locale-link-en').click()
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

  // navigate to pl blog
  const plBlog = url('/pl/blog/article')
  await page.goto(plBlog)
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('pl')
})
