import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, undiciRequest } from './utils'
import { getDom } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/different_domains`, import.meta.url)),
  // overrides
  nuxtConfig: {
    runtimeConfig: {
      public: {
        i18n: {
          locales: {
            en: {
              domain: 'en.staging.nuxt-app.localhost'
            },
            fr: {
              domain: 'fr.staging.nuxt-app.localhost'
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
        }
      ],
      differentDomains: true,
      detectBrowserLanguage: {
        useCookie: true
      }
    }
  }
})

test('pass `<NuxtLink> to props using domains from runtimeConfig', async () => {
  const res = await undiciRequest('/', {
    headers: {
      Host: 'fr.nuxt-app.localhost'
    }
  })
  const dom = getDom(await res.body.text())
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-en a').getAttribute('href')).toEqual(
    `http://en.staging.nuxt-app.localhost`
  )
  expect(dom.querySelector('#switch-locale-path-usages .switch-to-fr a').getAttribute('href')).toEqual(
    `http://fr.staging.nuxt-app.localhost`
  )
})
