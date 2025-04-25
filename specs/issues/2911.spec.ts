import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup } from '../utils'
import { renderPage } from '../helper'

describe('#2911', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
    browser: true,
    nuxtConfig: {
      app: {
        baseURL: '/base-path'
      },
      i18n: {
        detectBrowserLanguage: false
      }
    }
  })

  test('`useLocaleHead` uses Nuxt `app.baseURL` in meta tags', async () => {
    const { page } = await renderPage('/base-path')

    expect(await page.locator('head #i18n-alt-en').getAttribute('href')).toMatch(/\/base-path$/)
  })
})
