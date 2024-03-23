import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch, undiciRequest } from './utils'
import { getDom } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/different_domains`, import.meta.url)),
  // overrides
  nuxtConfig: {
    i18n: {
      locales: [
        {
          code: 'en',
          iso: 'en',
          name: 'English',
          domain: 'nuxt-app.localhost',
          domainDefault: true
        },
        {
          code: 'no',
          iso: 'no-NO',
          name: 'Norwegian',
          domain: 'nuxt-app.localhost'
        },
        {
          code: 'fr',
          iso: 'fr-FR',
          name: 'Français',
          domain: 'fr.nuxt-app.localhost',
          domainDefault: true
        },
        {
          code: 'ja',
          iso: 'jp-JA',
          name: 'Japan',
          domain: 'ja.nuxt-app.localhost',
          domainDefault: true
        }
      ],
      differentDomains: true,
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
    ['/', 'fr', 'fr.nuxt-app.localhost', 'Accueil']
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

test('pass `<NuxtLink> to props', async () => {
  const res = await undiciRequest('/', {
    headers: {
      Host: 'fr.nuxt-app.localhost'
    }
  })
  const dom = getDom(await res.body.text())
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-en a').getAttribute('href')).toEqual(
    `http://nuxt-app.localhost`
  )
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-no a').getAttribute('href')).toEqual(
    `http://nuxt-app.localhost/no`
  )
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-fr a').getAttribute('href')).toEqual(
    `http://fr.nuxt-app.localhost`
  )
})
