import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import { getDom, renderPage, waitForLocaleNetwork, waitForLocaleSwitch } from '../helper'
import { $fetch, setup } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      experimental: {
        optimizeMessageBundling: true
      },
      // add a yaml locale - the lazy fixture covers json/json5/js/ts
      locales: [
        { code: 'ja', language: 'ja-JP', file: 'lazy-locale-ja.yaml', name: '日本語' },
        { code: 'de', language: 'de-DE', file: 'lazy-locale-de.ts', name: 'Deutsch' }
      ]
    }
  }
})

describe('experimental.optimizeMessageBundling', () => {
  test('server renders messages from static json', async () => {
    const dom = await getDom(await $fetch('/'))
    expect(await dom.locator('#home-header')!.textContent()).toEqual('Homepage')
  })

  test('server renders messages from static json5', async () => {
    const dom = await getDom(await $fetch('/fr'))
    expect(await dom.locator('#home-header')!.textContent()).toEqual('Accueil')
  })

  test('server renders messages from static yaml', async () => {
    const dom = await getDom(await $fetch('/ja'))
    expect(await dom.locator('#home-header')!.textContent()).toEqual('ホームページ')
  })

  test('renders `<i18n>` custom block messages', async () => {
    const dom = await getDom(await $fetch('/block'))
    expect(await dom.locator('#block-message')!.textContent()).toEqual('Block message')

    const domFr = await getDom(await $fetch('/fr/block'))
    expect(await domFr.locator('#block-message')!.textContent()).toEqual('Message de bloc')
  })

  test('merges static files with executable locale files', async () => {
    const { page } = await renderPage('/en-GB')

    await expect.poll(() => page.locator('#home-header').innerText()).toEqual('Homepage')
    await expect.poll(() => page.locator('#profile-js').innerText()).toEqual('Profile1')
    await expect.poll(() => page.locator('#profile-ts').innerText()).toEqual('Profile2')
  })

  test('client-side locale switch fetches and renders messages', async () => {
    const { page } = await renderPage('/')

    await Promise.all([waitForLocaleNetwork(page, 'fr', 'response'), page.click('#nuxt-locale-link-fr')])
    await expect.poll(() => page.locator('#home-header').innerText()).toEqual('Accueil')

    await Promise.all([waitForLocaleNetwork(page, 'ja', 'response'), page.click('#nuxt-locale-link-ja')])
    await expect.poll(() => page.locator('#home-header').innerText()).toEqual('ホームページ')
  })

  // JSON drops message functions, so `de` keeps its loaders instead of using the endpoint
  describe('(#3880) message functions in locale files', () => {
    test('server renders them', async () => {
      const dom = await getDom(await $fetch('/de'))
      expect(await dom.locator('#home-header')!.textContent()).toEqual('Startseite')
    })

    test('they survive a client-side locale switch', async () => {
      const { page } = await renderPage('/')

      await Promise.all([waitForLocaleSwitch(page), page.click('#nuxt-locale-link-de')])
      expect(await page.locator('#home-header').innerText()).toEqual('Startseite')
      expect(await page.locator('#link-about').innerText()).toEqual('Über uns')
    })
  })
})
