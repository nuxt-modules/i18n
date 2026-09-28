import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, undiciRequest } from '../utils'
import { getDom, getDataFromDom } from '../helper'

// `brand-a` and `brand-b` are the same product under two different regional brand names -
// `isolate: true` keeps them from ever redirecting or cross-linking into each other's locale
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
          code: 'fr',
          language: 'fr',
          name: 'Français',
          domains: ['brand-b.nuxt-app.localhost'],
          defaultForDomains: ['brand-b.nuxt-app.localhost']
        }
      ],
      multiDomainLocales: { isolate: true },
      strategy: 'prefix_except_default',
      detectBrowserLanguage: {
        useCookie: true,
        cookieDomain: '.nuxt-app.localhost'
      }
    }
  }
})

test('a domain still serves and links its own locale normally', async () => {
  const res = await undiciRequest('/', { headers: { Host: 'brand-a.nuxt-app.localhost' } })
  expect(res.statusCode).toBe(200)
  const dom = await getDom(await res.body.text())
  expect(await dom.locator('#home-header').textContent()).toEqual('Homepage')
})

test('a locale not served on this domain 404s instead of relocating there', async () => {
  const res = await undiciRequest('/fr', { headers: { Host: 'brand-a.nuxt-app.localhost' } })

  expect(res.statusCode).toBe(404)
  expect(res.headers.location).toBeUndefined()
})

test('a browser-detected off-host locale does not redirect off the current domain', async () => {
  const res = await undiciRequest('/', {
    headers: { Host: 'brand-a.nuxt-app.localhost', 'Accept-Language': 'fr' }
  })

  expect(res.statusCode).toBe(200)
  expect(res.headers.location).toBeUndefined()
  const dom = await getDom(await res.body.text())
  expect(await dom.locator('#lang-switcher-current-locale code').textContent()).toEqual('en')
})

test('getBrowserLocale does not report a locale pruned off this domain', async () => {
  const res = await undiciRequest('/', {
    headers: { Host: 'brand-a.nuxt-app.localhost', 'Accept-Language': 'fr' }
  })

  const dom = await getDom(await res.body.text())
  expect(await dom.locator('#browser-locale').textContent()).toEqual('')
})

test('a cookie spanning the domains still keeps the other brand off-host', async () => {
  // without isolate, a `cookieDomain` spanning both domains would follow this cookie to brand-b
  const res = await undiciRequest('/', {
    headers: { Host: 'brand-a.nuxt-app.localhost', Cookie: 'i18n_redirected=fr' }
  })

  expect(res.statusCode).toBe(200)
  const dom = await getDom(await res.body.text())
  expect(await dom.locator('#lang-switcher-current-locale code').textContent()).toEqual('en')
})

test('getLocaleCookie does not report a locale pruned off this domain', async () => {
  const res = await undiciRequest('/', {
    headers: { Host: 'brand-a.nuxt-app.localhost', Cookie: 'i18n_redirected=fr' }
  })

  const dom = await getDom(await res.body.text())
  expect(await dom.locator('#cookie-locale').textContent()).toEqual('')
})

test('the switcher only lists the locale served on this domain', async () => {
  const res = await undiciRequest('/', { headers: { Host: 'brand-a.nuxt-app.localhost' } })
  const dom = await getDom(await res.body.text())

  expect(await dom.locator('#switch-locale-path-usages .switch-to-en').count()).toBe(1)
  expect(await dom.locator('#switch-locale-path-usages .switch-to-fr').count()).toBe(0)
})

test('composer.localeCodes excludes the locale pruned off this domain', async () => {
  const res = await undiciRequest('/', { headers: { Host: 'brand-a.nuxt-app.localhost' } })
  const dom = await getDom(await res.body.text())

  expect(JSON.parse(await dom.locator('#locale-codes').textContent())).toEqual(['en'])
})

test('hreflang alternates only list the locale served on this domain', async () => {
  const res = await undiciRequest('/', { headers: { Host: 'brand-a.nuxt-app.localhost' } })
  const dom = await getDom(await res.body.text())
  const localeHead = await getDataFromDom(dom, '#home-use-locale-head')

  const hreflangs = (localeHead.link as { rel: string; hreflang?: string }[])
    .filter(l => l.rel === 'alternate' && l.hreflang)
    .map(l => l.hreflang)
  expect(hreflangs).not.toContain('fr')
})

test('the other brand serves and links its own locale the same way', async () => {
  const res = await undiciRequest('/', { headers: { Host: 'brand-b.nuxt-app.localhost' } })
  expect(res.statusCode).toBe(200)
  const dom = await getDom(await res.body.text())

  expect(await dom.locator('#home-header').textContent()).toEqual('Accueil')
  expect(await dom.locator('#switch-locale-path-usages .switch-to-fr').count()).toBe(1)
  expect(await dom.locator('#switch-locale-path-usages .switch-to-en').count()).toBe(0)
})

test('a path for the other brand 404s there too', async () => {
  const res = await undiciRequest('/en', { headers: { Host: 'brand-b.nuxt-app.localhost' } })

  expect(res.statusCode).toBe(404)
  expect(res.headers.location).toBeUndefined()
})
