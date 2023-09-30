import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

describe('nuxt layers-simple', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/fallback`, import.meta.url)),
    browser: true,
    // overrides
    nuxtConfig: {
      extends: [
        fileURLToPath(new URL(`../fixtures/layers/layer-simple`, import.meta.url)),
        fileURLToPath(new URL(`../fixtures/layers/layer-pages`, import.meta.url))
      ]
    }
  })

  test('layer provides locale `nl`', async () => {
    const home = url('/')
    const page = await createPage(undefined)
    await page.goto(home)

    expect(await getText(page, '#set-locale-link-nl')).toEqual('nl')
  })

  test('layer provides page', async () => {
    const home = url('/nl/layer-page')
    const page = await createPage(undefined)
    await page.goto(home)

    expect(await getText(page, '#i18n-layer-target')).toEqual('Hallo wereld!')
  })
})
