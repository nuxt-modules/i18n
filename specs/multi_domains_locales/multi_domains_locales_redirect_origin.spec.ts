import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, undiciRequest } from '../utils'

// `brand-c` serves `ja` and `ko` but neither claims it through `defaultForDomains`, so the host
// resolves its first configured locale rather than the configured `defaultLocale`, which is
// served on `brand-a` - the visitor stays on the domain they asked for (reported in #4101)
await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/multi_domains_locales`, import.meta.url)),
  nuxtConfig: {
    i18n: {
      baseUrl: 'http://localhost:3000',
      defaultLocale: 'en',
      locales: [
        {
          code: 'en',
          language: 'en',
          name: 'English',
          domains: ['brand-a.nuxt-app.localhost'],
          defaultForDomains: ['brand-a.nuxt-app.localhost']
        },
        {
          code: 'ja',
          language: 'ja-JA',
          name: 'Japan',
          domains: ['brand-c.nuxt-app.localhost']
        },
        {
          code: 'ko',
          language: 'ko-KO',
          name: 'Korea',
          domains: ['brand-c.nuxt-app.localhost']
        }
      ],
      multiDomainLocales: true,
      strategy: 'prefix',
      detectBrowserLanguage: {
        useCookie: true,
        cookieDomain: '.nuxt-app.localhost'
      }
    }
  }
})

test('a host claiming no default locale resolves one of its own locales', async () => {
  const res = await undiciRequest('/', { headers: { Host: 'brand-c.nuxt-app.localhost' } })

  expect(res.statusCode).toBe(302)
  expect(res.headers.location).toBe('http://brand-c.nuxt-app.localhost/ja')
})

test('a locale path served by another domain relocates there', async () => {
  const res = await undiciRequest('/en', { headers: { Host: 'brand-c.nuxt-app.localhost' } })

  expect(res.statusCode).toBe(302)
  expect(res.headers.location).toBe('http://brand-a.nuxt-app.localhost/en')
})

test('a detected locale served by another domain relocates there in one hop', async () => {
  const res = await undiciRequest('/', {
    headers: { 'Host': 'brand-c.nuxt-app.localhost', 'Accept-Language': 'en' }
  })

  expect(res.statusCode).toBe(302)
  expect(res.headers.location).toBe('http://brand-a.nuxt-app.localhost/en')
})

test('a cookie locale is followed off-host when `cookieDomain` spans the domains', async () => {
  const res = await undiciRequest('/', {
    headers: { Host: 'brand-c.nuxt-app.localhost', Cookie: 'i18n_redirected=en' }
  })

  expect(res.statusCode).toBe(302)
  expect(res.headers.location).toBe('http://brand-a.nuxt-app.localhost/en')
})

test('a host claiming a default locale keeps resolving its own origin', async () => {
  const res = await undiciRequest('/', { headers: { Host: 'brand-a.nuxt-app.localhost' } })

  expect(res.statusCode).toBe(302)
  expect(res.headers.location).toBe('http://brand-a.nuxt-app.localhost/en')
})
