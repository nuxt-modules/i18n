import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch, undiciRequest } from '../utils'
import { getDom } from '../helper'

const i18nDomains = ['nuxt-app.localhost', 'fr.nuxt-app.localhost', 'ja.nuxt-app.localhost']

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
  // overrides
  nuxtConfig: {
    i18n: {
      lazy: false,
      baseUrl: 'http://localhost:3000',
      locales: [
        {
          code: 'en',
          iso: 'en',
          name: 'English',
          domain: undefined,
          domains: i18nDomains,
          defaultForDomains: ['nuxt-app.localhost'],
          domainDefault: true
        },
        {
          code: 'fr',
          iso: 'fr-FR',
          name: 'Français',
          domain: undefined,
          domains: i18nDomains,
          defaultForDomains: ['fr.nuxt-app.localhost'],
          domainDefault: true
        },
        {
          code: 'ja',
          iso: 'jp-JA',
          name: 'Japan',
          domain: undefined,
          domains: i18nDomains,
          defaultForDomains: ['ja.nuxt-app.localhost'],
          domainDefault: true
        },
        {
          code: 'no',
          iso: 'no-NO',
          name: 'Norwegian',
          domain: undefined,
          domains: i18nDomains,
          domainDefault: true
        }
      ],
      differentDomains: true,
      strategy: 'prefix',
      detectBrowserLanguage: {
        useCookie: true
      },
      defaultLocale: ''
    }
  }
})

describe('detection locale with host on server', () => {
  test.each([
    ['/en', 'en', 'nuxt-app.localhost', 'Homepage'],
    ['/no', 'no', 'nuxt-app.localhost', 'Hjemmeside'],
    ['/fr', 'fr', 'nuxt-app.localhost', 'Accueil'],
    ['/fr', 'fr', 'fr.nuxt-app.localhost', 'Accueil'],
    ['/en', 'en', 'fr.nuxt-app.localhost', 'Homepage'],
    ['/no', 'no', 'fr.nuxt-app.localhost', 'Hjemmeside']
  ])('%s host', async (path, locale, host, header) => {
    const res = await undiciRequest(path, {
      headers: {
        Host: host
      }
    })

    const html = await res.body.text()

    console.log(html)

    const dom = getDom(html)

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

test('pass `<NuxtLink> to props', async () => {
  const res = await undiciRequest('/', {
    headers: {
      Host: 'fr.nuxt-app.localhost'
    }
  })
  const dom = getDom(await res.body.text())
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-en a').getAttribute('href')).toEqual(
    `http://fr.nuxt-app.localhost/en`
  )
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-no a').getAttribute('href')).toEqual(
    `http://fr.nuxt-app.localhost/no`
  )
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-fr a').getAttribute('href')).toEqual(
    `http://fr.nuxt-app.localhost/fr`
  )
})
