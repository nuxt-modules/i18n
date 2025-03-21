import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { createPage, setup, url } from '../utils'
import { getText } from '../helper'

describe('#3404', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/3404`, import.meta.url)),
    browser: true
  })

  test('resource optimization excludes files not configured in `i18n.locales.*.files`', async () => {
    const page = await createPage('/en')
    const heading = await getText(page, '#translated-heading')
    expect(heading).toEqual(`Hello!`)

    await page.goto(url('/nl'))
    const heading2 = await getText(page, '#translated-heading')
    expect(heading2).toEqual(`Hallo!`)
  })
})
