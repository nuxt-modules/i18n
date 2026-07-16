import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, undiciRequest } from '../utils'
import { getDom } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
  // overrides
  nuxtConfig: {
    app: {
      baseURL: '/base-path'
    },
    i18n: {
      baseUrl: 'http://localhost:3000',
      defaultLocale: 'en',
      rootRedirect: 'about',
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
      detectBrowserLanguage: false
    }
  }
})

test('(#3628) `switchLocalePath` includes `app.baseURL`', async () => {
  const res = await undiciRequest('/base-path/about')
  const dom = await getDom(await res.body.text())
  expect(await dom?.locator('#nuxt-locale-link-kr')?.getAttribute('href')).toEqual(
    `http://kr.nuxt-app.localhost/base-path/about`
  )
})

// the SSR redirect location joins the locale domain and `app.baseURL`, the base
// should appear exactly once (domain and `baseUrl` values are configured without it)
test('(#3887) SSR root redirect includes `app.baseURL` once after the locale domain', async () => {
  const res = await undiciRequest('/base-path/', {
    headers: { 'X-Forwarded-Host': 'en.nuxt-app.localhost' }
  })

  expect(res.statusCode).toBe(302)
  expect(res.headers.location).toEqual('http://en.nuxt-app.localhost/base-path/about')
})
