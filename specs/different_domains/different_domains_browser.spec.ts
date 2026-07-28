import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'

// two ports on one SSR build act as two real origins, so the browser produces the actual
// cross-origin `Referer` the detection suppression keys on - requests with hand-injected
// headers cannot catch a regression here (`noreferrer` on the switcher once stripped it)
await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
  browser: true,
  // fixed ports - the locale domains below are baked into the build and cannot be random
  port: [7793, 7794],
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en',
      locales: [
        { code: 'en', language: 'en', domain: '127.0.0.1:7793' },
        { code: 'fr', language: 'fr-FR', domain: '127.0.0.1:7794' }
      ],
      strategy: 'no_prefix',
      detectBrowserLanguage: { useCookie: false }
    }
  }
})

test('a first visit relocates to the browser locale domain, switching back is not bounced', async () => {
  const page = await createPage(undefined, { locale: 'fr-FR' })

  await page.goto(url('/', 7793))
  await page.waitForURL(url('/', 7794))
  await expect.poll(() => page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')

  // the switch link is an explicit choice, detection on the target domain keeps it
  await page.locator('#switch-locale-path-link-en').click()
  await page.waitForURL(url('/', 7793))
  await expect.poll(() => page.locator('#lang-switcher-current-locale code').innerText()).toEqual('en')
  expect(new URL(page.url()).port).toBe('7793')

  await page.close()
})

test('a plain `NuxtLink` switcher cannot mark the arrival as internal (known limitation)', async () => {
  // Nuxt defaults absolute links to `noreferrer`, so without a referer or a cookie spanning
  // the domains the arrival reads as a first visit and detection sends it back - cross-domain
  // switchers need `SwitchLocalePathLink` (or a `cookieDomain` shared by the domains)
  const page = await createPage(undefined, { locale: 'fr-FR' })

  await page.goto(url('/', 7793))
  await page.waitForURL(url('/', 7794))

  await Promise.all([
    page.waitForResponse(res => res.url() === url('/', 7793)),
    page.locator('#nuxt-locale-link-en').click()
  ])
  await page.waitForURL(url('/', 7794))
  await expect.poll(() => page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')

  await page.close()
})
