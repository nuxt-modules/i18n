import { test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '../utils'
import { getDom, assertLocaleHeadWithDom } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en',
      baseUrl: () => {
        if (import.meta.server) {
          // @ts-ignore
          const headers = useRequestHeaders(['x-override-base-url'])
          const xOverrideBaseUrl = headers['x-override-base-url']
          if (Array.isArray(xOverrideBaseUrl)) {
            return xOverrideBaseUrl[0]
          }
          return xOverrideBaseUrl || ''
        }
        return ''
      }
    }
  }
})

test('render seo tags with baseUrl', async () => {
  const html = await $fetch('/?noncanonical', {
    headers: {
      'X-Override-Base-Url': 'CUSTOM'
    }
  })
  const dom = getDom(html)
  await assertLocaleHeadWithDom(dom, '#home-use-locale-head')
})
