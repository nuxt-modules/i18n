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
    Array.from(dom.querySelectorAll(`[rel="alternate"]`)).map(x => ({
      id: x.getAttribute('id'),
      href: x.getAttribute('href')
    }))
  ).toMatchInlineSnapshot(`
    [
      {
        "href": "http://localhost:7786",
        "id": "i18n-xd",
      },
      {
        "href": "http://localhost:7786",
        "id": "i18n-alt-en",
      },
      {
        "href": "http://localhost:7786",
        "id": "i18n-alt-en-US",
      },
      {
        "href": "http://localhost:7787",
        "id": "i18n-alt-es",
      },
      {
        "href": "http://localhost:7787",
        "id": "i18n-alt-es-ES",
      },
    ]
  `)
})
