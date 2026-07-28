import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, undiciRequest } from '../utils'

// `brand-c` serves `ja` and `ko` but neither claims it through `defaultForDomains`, so the host
// resolves the configured `defaultLocale` instead, which is served on `brand-a`. Redirect origins
// are resolved from the host rather than that locale, otherwise the visitor leaves the domain
// they asked for (reported in #4101)
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
        useCookie: true
      }
    }
  }
})

test('a host claiming no default locale keeps its own origin', async () => {
  const res = await undiciRequest('/', { headers: { Host: 'brand-c.nuxt-app.localhost' } })

  expect(res.statusCode).toBe(302)
  expect(res.headers.location).toBe('http://brand-c.nuxt-app.localhost/en')
})

// the host still resolves a locale it does not serve, so following the redirect relocates once
// more, `resolveDefaultLocale` picking a served locale is the open half of this (see #4101)
test('the locale it lands on is still the cluster default, which relocates from there', async () => {
  const res = await undiciRequest('/en', { headers: { Host: 'brand-c.nuxt-app.localhost' } })

  expect(res.statusCode).toBe(302)
  expect(res.headers.location).toBe('http://brand-a.nuxt-app.localhost/en')
})

test('a host claiming a default locale keeps resolving its own origin', async () => {
  const res = await undiciRequest('/', { headers: { Host: 'brand-a.nuxt-app.localhost' } })

  expect(res.statusCode).toBe(302)
  expect(res.headers.location).toBe('http://brand-a.nuxt-app.localhost/en')
})
