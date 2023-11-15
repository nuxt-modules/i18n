import { test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '../utils'
import { getDom, assertLocaleHeadWithDom } from '../helper'

const getUrl = () => {
  if (process.server) {
    // @ts-ignore
    const headers = useRequestHeaders(['x-override-base-url'])
    const xOverrideBaseUrl = headers['x-override-base-url']
    console.log('xOverrideBaseUrl', xOverrideBaseUrl)
    if (Array.isArray(xOverrideBaseUrl)) {
      return xOverrideBaseUrl[0]
    }
    return xOverrideBaseUrl || ''
  }
  return ''
}

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  // overrides
  nuxtConfig: {
    hooks: {
      'site-config:resolve': siteConfig => {
        siteConfig.url = getUrl()
      }
    },
    i18n: {
      defaultLocale: 'en'
    }
  }
})

test('render seo tags with site.url', async () => {
  const html = await $fetch('/?noncanonical', {
    headers: {
      'X-Override-Base-Url': 'CUSTOM'
    }
  })
  const dom = getDom(html)
  await assertLocaleHeadWithDom(dom, '#home-use-locale-head')
})
