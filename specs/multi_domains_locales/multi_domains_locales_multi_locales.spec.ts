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
    const dom = getDom(await res.body.text())

    expect(dom.querySelector('#lang-switcher-current-locale code').textContent).toEqual(locale)
    expect(dom.querySelector('#home-header').textContent).toEqual(header)
  })
})

test('detection locale with x-forwarded-host on server', async () => {
  const html = await $fetch('/', {
    headers: {
      'X-Forwarded-Host': 'fr.nuxt-app.localhost'
    }
  })
  const dom = getDom(html)

  expect(dom.querySelector('#lang-switcher-current-locale code').textContent).toEqual('fr')
  expect(dom.querySelector('#home-header').textContent).toEqual('Accueil')
})
