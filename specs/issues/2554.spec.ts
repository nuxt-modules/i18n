import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup, url } from '../utils'
import { renderPage } from '../helper'

describe('#2554', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2554`, import.meta.url)),
    browser: true
  })

  test('should not throw an error when using `setLocale` from plugin', async () => {
    const { page } = await renderPage('/')

    const res1 = await page.goto(url('/?pluginSetLocale=fr'))
    expect(res1?.ok()).toBeTruthy()

    const res2 = await page.goto(url('/?pluginSetLocale=en'))
    expect(res2?.ok()).toBeTruthy()
  })
})
