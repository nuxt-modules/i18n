import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch, undiciRequest } from '../utils'
import { getDom } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
  // overrides
  nuxtConfig: {
    extends: [fileURLToPath(new URL(`../fixtures/layers/layer-domain`, import.meta.url))],
    runtimeConfig: {
      public: {
        i18n: {
          domainLocales: {
            kr: {
              domain: 'kr.staging.nuxt-app.localhost'
            }
          }
        }
      }
    },
    i18n: {
      baseUrl: 'http://localhost:3000',
      locales: [
        {
          code: 'en',
          language: 'en',
          name: 'English',
          domain: 'en.nuxt-app.localhost'
        },
        {
          code: 'fr',
          language: 'fr-FR',
          name: 'Français',
          domain: 'fr.nuxt-app.localhost'
        },
        {
          code: 'kr',
          language: 'ko-KR',
          name: '한국어',
          domain: 'kr.nuxt-app.localhost'
        }
      ],
      strategy: 'no_prefix',
      detectBrowserLanguage: {
        useCookie: true
      },
      customRoutes: 'config',
      pages: {
        'localized-route': {
          en: '/localized-in-english',
          fr: '/localized-in-french',
          ja: '/localized-in-japanese',
          nl: '/localized-in-dutch'
        }
      }
    }
  }
})

describe('detection locale with host on server', () => {
  test.each([
    ['en', 'en.nuxt-app.localhost', 'Homepage'],
    ['fr', 'fr.nuxt-app.localhost', 'Accueil']
  ])('%s host', async (locale, host, header) => {
    const res = await undiciRequest('/', {
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

test('pass `<NuxtLink> to props', async () => {
  const res = await undiciRequest('/', {
    headers: {
      Host: 'fr.nuxt-app.localhost'
    }
  })
  const dom = await getDom(await res.body.text())
  expect(await dom.locator('#switch-locale-path-usages .switch-to-en a').getAttribute('href')).toEqual(
    `http://en.nuxt-app.localhost`
  )
  expect(await dom.locator('#switch-locale-path-usages .switch-to-fr a').getAttribute('href')).toEqual(
    `http://fr.nuxt-app.localhost`
  )
})

test('layer provides locales with domains', async () => {
  const res = await undiciRequest('/', {
    headers: {
      Host: 'fr.nuxt-app.localhost'
    }
  })
  const dom = await getDom(await res.body.text())

  // `en` link uses project domain configuration, overrides layer
  expect(await dom.locator('#switch-locale-path-usages .switch-to-en a').getAttribute('href')).toEqual(
    `http://en.nuxt-app.localhost`
  )

  // `nl` link uses layer domain configuration
  expect(await dom.locator('#switch-locale-path-usages .switch-to-nl a').getAttribute('href')).toEqual(
    `http://layer-nl.example.com`
  )
  // `ja` link uses layer domain configuration
  expect(await dom.locator('#switch-locale-path-usages .switch-to-ja a').getAttribute('href')).toEqual(
    `http://layer-ja.example.com`
  )
})

test('pass `<NuxtLink> to props using domains from runtimeConfig', async () => {
  const res = await undiciRequest('/', {
    headers: {
      Host: 'fr.nuxt-app.localhost'
    }
  })
  const dom = await getDom(await res.body.text())
  expect(await dom.locator('#switch-locale-path-usages .switch-to-kr a').getAttribute('href')).toEqual(
    `http://kr.staging.nuxt-app.localhost`
  )
})

test.each([
  ['en.nuxt-app.localhost', 'Welcome'],
  ['fr.nuxt-app.localhost', 'Bienvenue']
])('(#2374) detect %s with host on server', async (host, header) => {
  const res = await undiciRequest('/', {
    headers: {
      host: host
    }
  })
  const dom = await getDom(await res.body.text())
  expect(await dom.locator('#welcome-text').textContent()).toEqual(header)
})

test('(#2931) detect using runtimeConfig domain', async () => {
  const res = await undiciRequest('/', {
    headers: {
      host: 'kr.staging.nuxt-app.localhost'
    }
  })
  const dom = await getDom(await res.body.text())
  expect(await dom.locator('#welcome-text').textContent()).toEqual('환영하다')
})

test('(#2374) detect with x-forwarded-host on server', async () => {
  const html = await $fetch('/', {
    headers: {
      'X-Forwarded-Host': 'fr.nuxt-app.localhost'
    }
  })
  const dom = await getDom(html)

  expect(await dom.locator('#welcome-text').textContent()).toEqual('Bienvenue')
})

test("supports custom routes with `strategy: 'no_prefix'`", async () => {
  const res = await undiciRequest('/localized-in-french', {
    headers: {
      host: 'fr.nuxt-app.localhost'
    }
  })
  const resBody = await res.body.text()
  const dom = await getDom(resBody)

  // `en` link uses project domain configuration, overrides layer
  expect(await dom.locator('#switch-locale-path-usages .switch-to-en a').getAttribute('href')).toEqual(
    `http://en.nuxt-app.localhost/localized-in-english`
  )

  // `nl` link uses layer domain configuration
  expect(await dom.locator('#switch-locale-path-usages .switch-to-nl a').getAttribute('href')).toEqual(
    `http://layer-nl.example.com/localized-in-dutch`
  )
  // `ja` link uses layer domain configuration
  expect(await dom.locator('#switch-locale-path-usages .switch-to-ja a').getAttribute('href')).toEqual(
    `http://layer-ja.example.com/localized-in-japanese`
  )
})
