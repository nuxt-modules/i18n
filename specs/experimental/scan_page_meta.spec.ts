import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url } from '../utils'
import { getText, renderPage } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic_usage`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    experimental: {
      scanPageMeta: true
    }
  }
})

describe('Using Nuxt experimental feature `scanPageMeta`', async () => {
  test('can access localized alias', async () => {
    const { page } = await renderPage('/')

    // Aliases path renders home
    await page.goto(url('/aliased-home-path'))
    expect(await getText(page, 'title')).toEqual('Page - Homepage')

    await page.goto(url('/fr/aliased-home-path'))
    expect(await getText(page, 'title')).toEqual('Page - Accueil')
  })
})
