import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch, undiciRequest } from '../utils'
import { getDom } from '../helper'

const i18nDomains = ['nuxt-app.localhost', 'fr.nuxt-app.localhost', 'ja.nuxt-app.localhost']

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/multi_domains_locales`, import.meta.url)),
  // overrides
  nuxtConfig: {
    i18n: {
      baseUrl: 'http://localhost:3000',
      locales: [
        {
          code: 'en',
          language: 'en',
          name: 'English',
          domains: i18nDomains,
          defaultForDomains: ['nuxt-app.localhost']
        },
        {
          code: 'no',
          language: 'no-NO',
          name: 'Norwegian',
          domains: i18nDomains
        },
        {
          code: 'fr',
          language: 'fr-FR',
          name: 'Français',
          domains: i18nDomains,
          defaultForDomains: ['fr.nuxt-app.localhost']
        },
        {
          code: 'ja',
          language: 'jp-JA',
          name: 'Japan',
          // restricted to its own domain, the other locales stay on all of them
          domains: ['ja.nuxt-app.localhost'],
          defaultForDomains: ['ja.nuxt-app.localhost']
        }
      ],
      multiDomainLocales: true,
      strategy: 'prefix_except_default',
      detectBrowserLanguage: {
        useCookie: true
      }
    }
  }
})

describe('detection locale with host on server', () => {
  test.each([
    ['/', 'en', 'nuxt-app.localhost', 'Homepage'],
    ['/no', 'no', 'nuxt-app.localhost', 'Hjemmeside'],
    ['/fr', 'fr', 'nuxt-app.localhost', 'Accueil'],
    ['/', 'fr', 'fr.nuxt-app.localhost', 'Accueil'],
    ['/en', 'en', 'fr.nuxt-app.localhost', 'Homepage'],
    ['/no', 'no', 'fr.nuxt-app.localhost', 'Hjemmeside']
  ])('%s host', async (path, locale, host, header) => {
    const res = await undiciRequest(path, {
      headers: {
        Host: host
      }
    })
    const dom = await getDom(await res.body.text())

    expect(await dom.locator('#lang-switcher-current-locale code').textContent()).toEqual(locale)
    expect(await dom.locator('#home-header').textContent()).toEqual(header)
  })
})

test('detection locale with x-forwarded-host on server', async () => {
  const html = await $fetch('/', {
    headers: {
      'X-Forwarded-Host': 'fr.nuxt-app.localhost'
    }
  })
  const dom = await getDom(html)

  expect(await dom.locator('#lang-switcher-current-locale code').textContent()).toEqual('fr')
  expect(await dom.locator('#home-header').textContent()).toEqual('Accueil')
})

describe('locales restricted to specific domains', () => {
  test.each([
    ['/ja', 'http://ja.nuxt-app.localhost'],
    ['/ja/parent/child', 'http://ja.nuxt-app.localhost/parent/child'],
    ['/ja/about?foo=bar', 'http://ja.nuxt-app.localhost/about?foo=bar']
  ])('%s is relocated to the domain serving it', async (path, location) => {
    const res = await undiciRequest(path, { headers: { Host: 'nuxt-app.localhost' } })

    expect(res.statusCode).toBe(302)
    // `ja` is the default on its own domain, so it lands there unprefixed
    expect(res.headers.location).toEqual(location)
  })

  test('a restricted locale is served on its own domain', async () => {
    const res = await undiciRequest('/', { headers: { Host: 'ja.nuxt-app.localhost' } })
    const dom = await getDom(await res.body.text())

    expect(res.statusCode).toBe(200)
    expect(await dom.locator('#lang-switcher-current-locale code').textContent()).toEqual('ja')
  })

  test('a cookie holding a restricted locale does not redirect off the current domain', async () => {
    const res = await undiciRequest('/', {
      headers: { Host: 'nuxt-app.localhost', Cookie: 'i18n_redirected=ja' }
    })
    const dom = await getDom(await res.body.text())

    expect(res.statusCode).toBe(200)
    expect(await dom.locator('#lang-switcher-current-locale code').textContent()).toEqual('en')
  })

  test('a restricted locale stays in the switcher and links to its own domain', async () => {
    const res = await undiciRequest('/', { headers: { Host: 'nuxt-app.localhost' } })
    const dom = await getDom(await res.body.text())

    expect(await dom.locator('#switch-locale-path-usages .switch-to-ja a').getAttribute('href')).toEqual(
      'http://ja.nuxt-app.localhost'
    )
    // locales served on the current host keep linking relative
    expect(await dom.locator('#switch-locale-path-usages .switch-to-no a').getAttribute('href')).toEqual('/no')
  })
})

describe('detection locale with child routes', () => {
  test.each([
    ['/parent/child', 'nuxt-app.localhost', 'Parent route test', 'Child route test'],
    ['/no/parent/child', 'nuxt-app.localhost', 'Forældrerutetest', 'Børns rute test'],
    ['/fr/parent/child', 'nuxt-app.localhost', 'Test de la voie parentale', 'Test de parcours pour enfants']
  ])('%s host', async (path, host, parentText, childText) => {
    const res = await undiciRequest(path, {
      headers: {
        Host: host
      }
    })
    const dom = await getDom(await res.body.text())

    expect(await dom.locator('#parent-text').textContent()).toEqual(parentText)
    expect(await dom.locator('#child-text').textContent()).toEqual(childText)
  })
})
