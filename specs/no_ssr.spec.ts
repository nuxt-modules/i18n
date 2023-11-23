import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from './utils'
import { getText } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/no_ssr`, import.meta.url))
})

test('(#2313) detection locale from domain', async () => {
  async function assertDifferentDomain(locale: string, browserLocale = 'en') {
    const home = url('/')
    const page = await createPage(undefined, {
      extraHTTPHeaders: {
        'X-Forwarded-Host': `${locale}.nuxt-app.localhost`
      },
      locale: browserLocale
    })
    await page.goto(home)
    expect(await getText(page, '#locale')).toEqual(locale)
    await page.close()
  }

  await assertDifferentDomain('en')
  await assertDifferentDomain('fr', 'fr')
})

test('(#2334) should not redirect loop, when use no_prefix and ssr: false', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  expect(await getText(page, '#top')).toEqual('Foo')
})
