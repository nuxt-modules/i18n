import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from '../utils'
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
      lang: en-US
      dir: ltr
    Link:
      canonical: http://localhost:7786
      alternate[x-default]: http://localhost:7786
      alternate[en]: http://localhost:7786
      alternate[en-US]: http://localhost:7786
      alternate[es]: http://localhost:7787
      alternate[es-ES]: http://localhost:7787
    Meta:
      og:url: http://localhost:7786
      og:locale: en_US
      og:locale:alternate: es_ES"
  `)
})
