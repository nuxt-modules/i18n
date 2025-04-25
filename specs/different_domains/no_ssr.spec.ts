import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
  nuxtConfig: {
    i18n: {
      defaultLocale: 'fr',
      differentDomains: true,
      locales: [
        {
          code: 'en',
          domain: 'en.nuxt-app.localhost'
        },
        {
          code: 'fr',
          domain: 'fr.nuxt-app.localhost'
        },
        {
          code: 'nl',
          domain: 'localhost'
        }
      ],
      strategy: 'no_prefix'
    },
    ssr: false
  }
})

test('(#2313) detection locale from domain', async () => {
  async function assertDifferentDomain(locale: string, browserLocale = 'en') {
    const page = await createPage(url('/'), {
      extraHTTPHeaders: {
        'X-Forwarded-Host': `${locale}.nuxt-app.localhost`
      },
      locale: browserLocale
    })

    expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual(locale)
    await page.close()
  }

  await assertDifferentDomain('en')
  await assertDifferentDomain('fr', 'fr')
})

test('(#2334) should not redirect loop, when use no_prefix and ssr: false', async () => {
  const page = await createPage(url('/'), { locale: 'fr' })

  expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')
})
