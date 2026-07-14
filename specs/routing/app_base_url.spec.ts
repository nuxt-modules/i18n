import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, fetch } from '../utils'
import { renderPage } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  browser: true,
  nuxtConfig: {
    app: {
      baseURL: '/base-path'
    },
    i18n: {
      strategy: 'prefix',
      defaultLocale: 'en',
      detectBrowserLanguage: {
        useCookie: false,
        redirectOn: 'no prefix'
      }
    }
  }
})

describe('`app.baseURL` is set', () => {
  // The SSR locale-redirect middleware used to compute the route path from `url.pathname`, which
  // still contains `app.baseURL`. With a base set this produced a relative path (e.g. "se-path/about"),
  // which vue-router's matcher rejected ("The Matcher cannot resolve relative paths"). `isExistingNuxtRoute`
  // then failed to match and the redirect silently bailed - so the unprefixed path was never localized.
  test('(#3887) redirects an unprefixed path to its localized route', async () => {
    const res = await fetch('/base-path/about', { redirect: 'manual' })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toEqual('/base-path/en/about')
  })

  test('(#3887) redirects the root path to the localized root', async () => {
    const res = await fetch('/base-path/', { redirect: 'manual' })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toEqual('/base-path/en')
  })

  test('(#3887) does not redirect a prefixed path', async () => {
    const res = await fetch('/base-path/en/about', { redirect: 'manual' })

    expect(res.status).toBe(200)
  })

  test('(#2911) `useLocaleHead` uses Nuxt `app.baseURL` in meta tags', async () => {
    const { page } = await renderPage('/base-path/en')

    expect(await page.locator('head #i18n-alt-en').getAttribute('href')).toMatch(/\/base-path\/en$/)
  })
})
