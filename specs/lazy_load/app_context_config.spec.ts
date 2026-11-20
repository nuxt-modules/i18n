import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import { setup, $fetch } from '../utils'
import { renderPage } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
  browser: true,
  nuxtConfig: {
    i18n: {
      vueI18n: 'app-context-i18n.config'
    }
  }
})

describe('(#4150) a vue-i18n config that needs the Nuxt app', () => {
  test('leaves the server context intact instead of failing in nitro', async () => {
    // the handler resolves the locale from the route, any `:hash` segment reaches it
    const messages = await $fetch<Record<string, Record<string, unknown>>>('/_i18n/test/en/messages.json')

    expect(messages.en).toHaveProperty('home', 'Homepage')
  })

  test('is applied by the app during SSR, where its composables resolve', async () => {
    const html = await $fetch('/app-context-config')

    expect(html).toMatch(/<span id="request-host">127\.0\.0\.1:\d+<\/span>/)
  })

  test('keeps the fallback locale it declares, which nitro never got to read', async () => {
    const html = await $fetch('/fr/app-context-config')

    // `welcome` is only in the English locale file, so it arrives through the fallback
    expect(html).toContain('<span id="fallback-key">Welcome!</span>')
  })

  test('keeps the fallback messages in the browser, where the endpoint cannot merge them in', async () => {
    const { page } = await renderPage('/fr/app-context-config')

    expect(await page.locator('#fallback-key').innerText()).toEqual('Welcome!')
    expect(await page.locator('#request-host').innerText()).toMatch(/^127\.0\.0\.1:\d+$/)
  })
})
