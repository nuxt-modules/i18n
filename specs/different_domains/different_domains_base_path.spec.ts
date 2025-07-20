import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch, undiciRequest } from '../utils'
import { getDom } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
  // overrides
  nuxtConfig: {
    extends: [fileURLToPath(new URL(`../fixtures/layers/layer-domain`, import.meta.url))],
    app: {
      baseURL: '/base-path'
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

test('(#3628) `switchLocalePath` includes `app.baseURL`', async () => {
  const res = await undiciRequest('/base-path')
  const dom = getDom(await res.body.text())
  expect(dom?.querySelector('#switch-locale-path-usages .switch-to-kr a')?.getAttribute('href')).toEqual(
    `http://kr.nuxt-app.localhost/base-path`
  )
})
