import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { gotoPath, renderPage, setServerRuntimeConfig } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: 'prefix_and_default',
      detectBrowserLanguage: {
        redirectOn: 'all'
      }
    }
  }
})

test('redirectOn: all', async () => {
  await setServerRuntimeConfig({
    public: {
      i18n: {
        detectBrowserLanguage: {
          alwaysRedirect: false,
          redirectOn: 'no prefix'
        }
      }
    }
  })
  const { page } = await renderPage('/blog/article', { locale: 'fr' })

  // detect locale from navigator language
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')

  // click `en` lang switch link
  await page.locator('#set-locale-link-en').clickNavigate()
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('en')

  // navigate to home
  await gotoPath(page, '/')
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('en')
})

test('redirectOn: no prefix', async () => {
  await setServerRuntimeConfig({
    public: {
      i18n: {
        detectBrowserLanguage: {
          alwaysRedirect: false,
          redirectOn: 'no prefix'
        }
      }
    }
  })
  const { page } = await renderPage('/blog/article', { locale: 'fr' })

  // detect locale from navigator language
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')

  // click `en` lang switch link
  await page.locator('#set-locale-link-en').clickNavigate()
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('en')

  // navigate to fr blog
  await gotoPath(page, '/fr/blog/article')
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')
})

test('alwaysRedirect: all', async () => {
  await setServerRuntimeConfig({
    public: {
      i18n: {
        detectBrowserLanguage: {
          alwaysRedirect: true,
          redirectOn: 'all'
        }
      }
    }
  })
  const blog = '/blog/article'
  const { page } = await renderPage(blog, { locale: 'en' }) // set browser locale

  // detect locale from navigator language
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('en')

  // click `fr` lang switch link
  await page.locator('#set-locale-link-fr').clickNavigate()
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')

  // go to `en` home page
  await page.goto(url(blog))
  await page.waitForURL(url('/fr/blog/article'))
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')
})

test('alwaysRedirect: no prefix', async () => {
  await setServerRuntimeConfig({
    public: {
      i18n: {
        detectBrowserLanguage: {
          alwaysRedirect: true,
          redirectOn: 'no prefix'
        }
      }
    }
  })
  const { page } = await renderPage('/about', { locale: 'en' }) // set browser locale
  const ctx = await page.context()

  // detect locale from navigator language
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('en')
  expect(await ctx.cookies()).toMatchObject([{ name: 'i18n_redirected', value: 'en' }])

  // click `fr` lang switch with nutlink
  await page.locator('#set-locale-link-fr').clickNavigate()
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')
  expect(await ctx.cookies()).toMatchObject([{ name: 'i18n_redirected', value: 'fr' }])

  // go to `blog/article` page
  await page.goto(url('/blog/article'))
  expect(page.url().endsWith('/fr/about'))
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')

  // go to `/about` page
  await page.goto(url('/about'))
  expect(page.url().endsWith('/fr/about'))
  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')
})
