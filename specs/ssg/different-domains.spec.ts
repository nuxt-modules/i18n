import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '../utils'
import { getDom } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/domain-ssg`, import.meta.url)),
  browser: true,
  prerender: true,
  // overrides
  nuxtConfig: {},
  port: [7787, 7786]
})

test('`differentDomains` with `no_prefix` has hreflang links', async () => {
  const html = await $fetch('/')
  const dom = getDom(html)
  expect(
    Array.from(dom.querySelectorAll(`[rel="alternate"]`)).map(
      x => x.getAttribute('hreflang') + ' ' + x.getAttribute('href')
    )
  ).toMatchInlineSnapshot(`
    [
      "x-default http://localhost:7786",
      "x-default http://localhost:7786",
      "en http://localhost:7786",
      "en-US http://localhost:7786",
      "es http://localhost:7787",
      "es-ES http://localhost:7787",
    ]
  `)
})
