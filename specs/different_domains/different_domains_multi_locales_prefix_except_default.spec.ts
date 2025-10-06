import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch, undiciRequest } from '../utils'
import { getDom } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
  // overrides
  nuxtConfig: {
    i18n: {
      baseUrl: 'http://localhost:3000',
      locales: [
        {
          code: 'en',
          language: 'en',
          name: 'English',
          domain: 'nuxt-app.localhost',
          domainDefault: true
        },
        {
          code: 'no',
          language: 'no-NO',
          name: 'Norwegian',
          domain: 'nuxt-app.localhost'
        },
        {
          code: 'fr',
          language: 'fr-FR',
          name: 'Français',
          domain: 'fr.nuxt-app.localhost',
          domainDefault: true
        },
        {
          code: 'ja',
          language: 'jp-JA',
          name: 'Japan',
          domain: 'ja.nuxt-app.localhost',
          domainDefault: true
        }
      ],
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
    `http://nuxt-app.localhost`
  )
  expect(await dom.locator('#switch-locale-path-usages .switch-to-no a').getAttribute('href')).toEqual(
    `http://nuxt-app.localhost/no`
  )
  expect(await dom.locator('#switch-locale-path-usages .switch-to-fr a').getAttribute('href')).toEqual(
    `http://fr.nuxt-app.localhost`
  )
})
