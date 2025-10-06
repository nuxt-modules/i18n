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
          domains: i18nDomains,
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
