import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch, undiciRequest } from './utils'
import { getDom } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/different_domains`, import.meta.url)),
  // overrides
  nuxtConfig: {
    extends: [fileURLToPath(new URL(`./fixtures/layers/layer-domain`, import.meta.url))],
    runtimeConfig: {
      public: {
        i18n: {
          locales: {
            kr: {
              domain: 'kr.staging.nuxt-app.localhost'
            }
          }
        }
      }
    },
    i18n: {
      locales: [
        {
          code: 'en',
          iso: 'en',
          name: 'English',
          domain: 'en.nuxt-app.localhost'
        },
        {
          code: 'fr',
          iso: 'fr-FR',
          name: 'Français',
          domain: 'fr.nuxt-app.localhost'
        },
        {
          code: 'kr',
          iso: 'ko-KR',
          name: '한국어',
          domain: 'kr.nuxt-app.localhost'
        }
      ],
      differentDomains: true,
      detectBrowserLanguage: {
        useCookie: true
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

test('pass `<NuxtLink> to props', async () => {
  const res = await undiciRequest('/', {
    headers: {
      Host: 'fr.nuxt-app.localhost'
    }
  })
  const dom = getDom(await res.body.text())
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-en a').getAttribute('href')).toEqual(
    `http://en.nuxt-app.localhost`
  )
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-fr a').getAttribute('href')).toEqual(
    `http://fr.nuxt-app.localhost`
  )
})

test('layer provides locales with domains', async () => {
  const res = await undiciRequest('/', {
    headers: {
      Host: 'fr.nuxt-app.localhost'
    }
  })
  const dom = getDom(await res.body.text())

  // `en` link uses project domain configuration, overrides layer
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-en a').getAttribute('href')).toEqual(
    `http://en.nuxt-app.localhost`
  )

  // `nl` link uses layer domain configuration
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-nl a').getAttribute('href')).toEqual(
    `http://layer-nl.example.com`
  )
  // `ja` link uses layer domain configuration
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-ja a').getAttribute('href')).toEqual(
    `http://layer-ja.example.com`
  )
})

test('pass `<NuxtLink> to props using domains from runtimeConfig', async () => {
  const res = await undiciRequest('/', {
    headers: {
      Host: 'fr.nuxt-app.localhost'
    }
  })
  const dom = getDom(await res.body.text())
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-kr a').getAttribute('href')).toEqual(
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
  const dom = getDom(await res.body.text())
  expect(dom.querySelector('#welcome-text').textContent).toEqual(header)
})

test('(#2374) detect with x-forwarded-host on server', async () => {
  const html = await $fetch('/', {
    headers: {
      'X-Forwarded-Host': 'fr.nuxt-app.localhost'
    }
  })
  const dom = getDom(html)

  expect(dom.querySelector('#welcome-text').textContent).toEqual('Bienvenue')
})
