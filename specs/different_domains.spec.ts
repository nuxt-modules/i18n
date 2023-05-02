import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from './utils'
import { getDom } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/domain`, import.meta.url)),
  // overrides
  nuxtConfig: {
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
    const html = await $fetch('/', {
      headers: {
        Host: host
      }
    })
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
  const html = await $fetch('/', {
    headers: {
      Host: 'fr.nuxt-app.localhost'
    }
  })
  const dom = getDom(html)
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-en a').getAttribute('href')).toEqual(
    `http://en.nuxt-app.localhost`
  )
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-fr a').getAttribute('href')).toEqual(
    `http://fr.nuxt-app.localhost`
  )
})
