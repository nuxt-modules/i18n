import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/vue_i18n_options_loader`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      vueI18n: './vue-i18n.options.ts'
    }
  }
})

test('load option successfully', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  expect(await getText(page, '#home-header')).toEqual('Hello-World!')
})
