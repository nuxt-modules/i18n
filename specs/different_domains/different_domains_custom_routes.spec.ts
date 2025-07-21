import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch, undiciRequest } from '../utils'
// import { getDom } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
  // overrides
  nuxtConfig: {
    extends: [fileURLToPath(new URL(`../fixtures/layers/layer-domain`, import.meta.url))],
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
      differentDomains: true,
      strategy: 'no_prefix',
      detectBrowserLanguage: false,
      customRoutes: 'page'
    }
  }
})

test('domain includes only routes for its locale', async () => {
  const resFr = await undiciRequest('/localized-route', {
    headers: {
      host: 'fr.nuxt-app.localhost'
    }
  })
  expect(resFr.statusCode).toBe(200)

  const resEn = await undiciRequest('/localized-route', {
    headers: {
      host: 'en.nuxt-app.localhost'
    }
  })
  expect(resEn.statusCode).toBe(200)

  const resKr = await undiciRequest('/localized-route', {
    headers: {
      host: 'kr.nuxt-app.localhost'
    }
  })
  expect(resKr.statusCode).toBe(404)
})
