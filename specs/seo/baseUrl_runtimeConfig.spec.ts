import { expect, test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '../utils'
import { getDom, getDataFromDom, assertLocaleHeadWithDom } from '../helper'

const configDomain = 'https://runtime-config-domain.com'
await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic`, import.meta.url)),
  // overrides
  nuxtConfig: {
    runtimeConfig: {
      public: {
        i18n: {
          baseUrl: configDomain
        }
      }
    },
    i18n: {
      //   debug: true,
      defaultLocale: 'en',
      baseUrl: ''
    }
  }
})

test('render seo tags with baseUrl', async () => {
  const html = await $fetch('/?noncanonical')
  const dom = getDom(html)
  await assertLocaleHeadWithDom(dom, '#home-use-locale-head')

  const links = getDataFromDom(dom, '#home-use-locale-head').link
  const i18nCan = links.find(x => x.id === 'i18n-can')
  expect(i18nCan.href).toContain(configDomain)
})
