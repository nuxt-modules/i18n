import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from './utils'
import { getText } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/basic_layer`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {}
})

test('register module hook', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  expect(await getText(page, '#register-module')).toEqual('This is a merged module layer locale key')

  // click `fr` lang switch link
  await page.locator('.switch-to-fr a').click()
  await page.waitForURL('**/fr')

  expect(await getText(page, '#register-module')).toEqual('This is a merged module layer locale key in French')

  // click `nl` lang switch link
  await page.locator('.switch-to-nl a').click()
  await page.waitForURL('**/nl')

  expect(await getText(page, '#register-module')).toEqual('This is a merged module layer locale key in Dutch')
})
