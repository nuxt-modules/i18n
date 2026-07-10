import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, undiciRequest } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
  // overrides
  nuxtConfig: {
    app: {
      baseURL: '/base-path'
    },
    i18n: {
      defaultLocale: 'en',
      rootRedirect: 'about',
      detectBrowserLanguage: false
    }
  }
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
