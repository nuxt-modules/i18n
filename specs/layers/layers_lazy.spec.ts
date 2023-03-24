import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic_layer`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    extends: [fileURLToPath(new URL(`../fixtures/layers/layer-lazy`, import.meta.url))]
  }
})
describe('nuxt layers-lazy', async () => {
  test('layer provides locale `nl` and translation for key `hello`', async () => {
    const home = url('/layer-page')
    const page = await createPage()
    await page.goto(home)

    expect(await getText(page, '#i18n-layer-target')).toEqual('Hello world!')

    const homeNL = url('/nl/layer-page')
    await page.goto(homeNL)
    expect(await getText(page, '#i18n-layer-target')).toEqual('Hallo wereld!')
  })
})
