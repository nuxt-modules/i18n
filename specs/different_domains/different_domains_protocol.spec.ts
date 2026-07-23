import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, undiciRequest } from '../utils'
import { getDom } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
  // overrides
  nuxtConfig: {
    i18n: {
      locales: [
        {
          code: 'en',
          language: 'en',
          name: 'English',
          domain: 'https://en.nuxt-app.localhost',
          domainDefault: true
        },
        {
          code: 'fr',
          language: 'fr-FR',
          name: 'Français',
          domain: 'https://fr.nuxt-app.localhost',
          domainDefault: true
        }
      ],
      defaultLocale: 'en',
      strategy: 'prefix_except_default'
    }
  }
})

describe('domains configured with protocol', () => {
  test.each([
    ['/', 'en.nuxt-app.localhost', 'en'],
    ['/', 'fr.nuxt-app.localhost', 'fr']
  ])('%s on %s serves domain default locale unprefixed', async (path, host, locale) => {
    const res = await undiciRequest(path, { headers: { Host: host } })
    expect(res.statusCode).toBe(200)
    const dom = await getDom(await res.body.text())
    expect(await dom.locator('#lang-switcher-current-locale code').textContent()).toEqual(locale)
  })

  test.each([
    ['en.nuxt-app.localhost', 'en'],
    ['fr.nuxt-app.localhost', 'fr']
  ])('unprefixed /about on %s serves %s without redirect', async (host, locale) => {
    const res = await undiciRequest('/about', { headers: { Host: host } })
    expect(res.statusCode).toBe(200)
    const dom = await getDom(await res.body.text())
    expect(await dom.locator('#lang-switcher-current-locale code').textContent()).toEqual(locale)
  })

  // the domain default locale is unprefixed on its domain and its prefixed variant removed
  test('prefixed path is not served on domain-default host', async () => {
    const res = await undiciRequest('/fr/about', { headers: { Host: 'fr.nuxt-app.localhost' } })
    expect(res.statusCode).toBe(404)
  })
})
