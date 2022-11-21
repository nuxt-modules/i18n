import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/vue_i18n_options_loader`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      vueI18n: './vue-i18n.messages.options.ts'
    }
  }
})

test('warning in messages option', async () => {
  const home = url('/')
  const page = await createPage()
  const messages: string[] = []
  page.on('console', msg => messages.push(msg.text()))
  await page.goto(home)
  await page.waitForTimeout(100)

  expect(messages[0]).include(
    `[@nuxtjs/i18n]: Cannot include 'messages' option in 'vue-i18n.messages.options.ts'. Please use Lazy-load translations.`
  )
})
