import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage, fetch } from '@nuxt/test-utils'

describe.skip('default', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
    // dev: true,
    browser: true,
    // overrides
    nuxtConfig: {
      i18n: {
        defaultLocale: 'en',
        detectBrowserLanguage: {
          useCookie: true,
          cookieKey: 'i18n_redirected',
          redirectOn: 'root'
        }
      }
    }
  })

  test('redirect to fr', async () => {
    const home = url('/')
    const page = await createPage()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const messages: string[] = []
    page.on('console', msg => console.log(`[browser]: ${msg.text()}`))
    const res = await page.goto(home)

    await fetch('/', {
      method: 'get',
      headers: {
        'Accept-Language': 'fr'
      }
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(res!.status()).toBe(302)
  })
})
