import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

describe('#2020', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2020`, import.meta.url))
  })

  test('pass query parameter', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    const existingPath = await getText(page, '#existing')
    const unexistingPath = await getText(page, '#unexisting')

    expect(existingPath).toBe('/fr/some-route?foo=bar')
    expect(unexistingPath).toBe('/i-dont-exist?foo=bar')
  })
})
