import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText } from '../helper'

describe('nuxt layers-pages', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
    browser: true,
    // overrides
    nuxtConfig: {
      // _generate: true,
      extends: [fileURLToPath(new URL(`../fixtures/layers/layer-pages`, import.meta.url))]
    }
  })

  test('layer provides locale `nl`', async () => {
    const home = url('/nl/layer-page')
    const page = await createPage(undefined, { locale: 'ja' }) // set browser locale
    await page.goto(home)

    expect(await getText(page, '#i18n-layer-target')).toEqual('Hallo wereld!')
  })
})
