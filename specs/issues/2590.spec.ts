import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup } from '../utils'
import { renderPage } from '../helper'

describe('#2590', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2590`, import.meta.url)),
    browser: true
  })

  test('Locale ISO code is required to generate alternate link', async () => {
    const { page } = await renderPage('/')

    // html tag `lang` attribute
    expect(await page.getAttribute('html', 'lang')).toMatch('en')

    // html tag `dir` attribute
    expect(await page.getAttribute('html', 'dir')).toMatch('ltr')
  })
})
