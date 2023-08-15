import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

describe('#2313', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2313`, import.meta.url))
  })

  async function assertDifferenctDomain(locale: string, browserLocale = 'en') {
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

  test('detection locale from domain', async () => {
    await assertDifferenctDomain('en')
    await assertDifferenctDomain('fr', 'fr')
  })
})
