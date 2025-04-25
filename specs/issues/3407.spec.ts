import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { createPage, setup, url, waitForHydration } from '../utils'

describe('#3407', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/3407`, import.meta.url)),
    browser: true,
    // this is an SSG test
    prerender: true,
    port: [7777, 7776]
  })

  test('`detectBrowserLanguage: false` disables locale detection in SSG', async () => {
    const page = await createPage('/')
    const heading = await page.locator('#translated-heading').innerText()
    expect(heading).toEqual(`Problema de i18n SSG`)

    const enPath = url('/', 7776)
    await page.goto(enPath)
    await waitForHydration(page, enPath, 'hydration')
    const heading2 = await page.locator('#translated-heading').innerText()
    expect(heading2).toEqual(`i18n SSG issue`)
  })
})
