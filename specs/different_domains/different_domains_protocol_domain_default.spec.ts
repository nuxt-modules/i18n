import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, undiciRequest } from '../utils'
import { getDom } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
  // overrides
  nuxtConfig: {
    i18n: {
      baseUrl: 'http://localhost:3000',
      // (#4042 regression) `domain` values include a protocol and every locale is
      // the default for its own domain - unprefixed paths must be served as-is
      locales: [
        {
          code: 'fr',
          language: 'fr-FR',
          name: 'Français',
          domain: 'https://fr.nuxt-app.localhost',
          domainDefault: true
        },
        {
          code: 'en',
          language: 'en',
          name: 'English',
          domain: 'https://nuxt-app.localhost',
          domainDefault: true
        }
      ],
      defaultLocale: 'fr',
      differentDomains: true,
      strategy: 'prefix_except_default',
      detectBrowserLanguage: false
    }
  }
})

describe('protocol-prefixed `domain` with `domainDefault`', () => {
  test.each([
    ['/', 'en', 'nuxt-app.localhost', '#home-header', 'Homepage'],
    ['/about', 'en', 'nuxt-app.localhost', '#about-header', 'About us'],
    ['/', 'fr', 'fr.nuxt-app.localhost', '#home-header', 'Accueil'],
    ['/about', 'fr', 'fr.nuxt-app.localhost', '#about-header', 'À propos']
  ])('%s serves %s unprefixed on %s', async (path, locale, host, selector, header) => {
    const res = await undiciRequest(path, {
      headers: {
        Host: host
      }
    })

    // must not redirect to the prefixed path (e.g. `/about` -> `/en/about`)
    expect(res.statusCode).toBe(200)

    const dom = await getDom(await res.body.text())
    expect(await dom.locator('#lang-switcher-current-locale code').textContent()).toEqual(locale)
    expect(await dom.locator(selector).textContent()).toEqual(header)
  })

  test('prefixed path does not exist for the domain default locale', async () => {
    const res = await undiciRequest('/en/about', {
      headers: {
        Host: 'nuxt-app.localhost'
      }
    })

    expect(res.statusCode).toBe(404)
  })
})
