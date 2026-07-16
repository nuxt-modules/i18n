import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, waitForHydration } from '../utils'
import { getHeadSnapshot, renderPage } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/domain-ssg`, import.meta.url)),
  browser: true,
  prerender: true,
  // overrides
  nuxtConfig: {},
  port: [7787, 7786]
})

test('`differentDomains` with `no_prefix` has hreflang links', async () => {
  const { page } = await renderPage('/')
  expect(await getHeadSnapshot(page)).toMatchInlineSnapshot(`
    "HTML:
      lang: es-ES
      dir: ltr
    Link:
      canonical: http://127.0.0.1:7787
      alternate[x-default]: http://127.0.0.1:7786
      alternate[en]: http://127.0.0.1:7786
      alternate[en-US]: http://127.0.0.1:7786
      alternate[es]: http://127.0.0.1:7787
      alternate[es-ES]: http://127.0.0.1:7787
    Meta:
      og:url: http://127.0.0.1:7787
      og:locale: es_ES
      og:locale:alternate: en_US"
  `)
})

test('(#3407) locale messages are loaded with `detectBrowserLanguage: false`', async () => {
  const { page } = await renderPage('/')
  const heading = page.locator('#translated-heading')
  expect(await heading.innerText()).toEqual('Problema de i18n SSG')

  const enPath = url('/', 7786)
  await page.goto(enPath)
  await waitForHydration(page, enPath, 'hydration')
  expect(await heading.innerText()).toEqual('i18n SSG issue')
})
