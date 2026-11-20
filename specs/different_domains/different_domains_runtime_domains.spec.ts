import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, undiciRequest } from '../utils'
import { getDom } from '../helper'

const hosts = [
  ['en', 'en.nuxt-app.localhost'],
  ['fr', 'fr.nuxt-app.localhost']
] as const

// one build deployed to several environments: the locales only configure `domainDefault`, their
// domains are set through runtime config
await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  nuxtConfig: {
    runtimeConfig: {
      public: {
        i18n: {
          domainLocales: Object.fromEntries(hosts.map(([locale, domain]) => [locale, { domain }]))
        }
      }
    },
    i18n: {
      strategy: 'prefix_except_default',
      differentDomains: true,
      detectBrowserLanguage: false,
      defaultLocale: 'en',
      locales: hosts.map(([code]) => ({ code, domainDefault: true }))
    }
  }
})

describe('(#4190) domains set through runtime config', () => {
  test.each(hosts)('%s host serves its locale unprefixed', async (locale, host) => {
    for (const path of ['/', '/about']) {
      const res = await undiciRequest(path, { headers: { Host: host } })

      expect(res.statusCode).toBe(200)
      const dom = await getDom(await res.body.text())
      expect(await dom.locator('#lang-switcher-current-locale code').textContent()).toEqual(locale)
    }
  })

  test.each(hosts)('%s host does not serve its own locale prefixed', async (locale, host) => {
    const res = await undiciRequest(`/${locale}/about`, { headers: { Host: host } })

    expect(res.statusCode).toBe(404)
  })

  test('a locale is linked unprefixed on the domain it is the default of', async () => {
    const res = await undiciRequest('/', { headers: { Host: 'en.nuxt-app.localhost' } })

    const dom = await getDom(await res.body.text())

    expect(await dom.locator('#nuxt-locale-link-fr').getAttribute('href')).toEqual('http://fr.nuxt-app.localhost')
  })
})
