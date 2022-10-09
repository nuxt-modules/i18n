import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'
import { getText } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en'
    }
  }
})

test('extend message hook', async () => {
  const home = url('/')
  const page = await createPage()
  const messages: string[] = []
  page.on('console', msg => messages.push(msg.text()))
  await page.goto(home)

  expect(await getText(page, '#extend-message')).toEqual('Hello from external module')

  // click `fr` lang switch link
  await page.locator('#lang-switcher-with-nuxt-link a').click()

  expect(await getText(page, '#extend-message')).toEqual('Bonjour depuis le module externe')
})
