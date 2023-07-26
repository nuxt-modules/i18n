import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

describe('#2255', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2255`, import.meta.url))
  })

  test('redirect with browser language locale', async () => {
    const home = url('/')
    const page = await createPage(undefined, { locale: 'fr' })
    await page.goto(home)

    expect(await getText(page, '#msg')).toEqual('Bienvenue')
  })

  test('redirect with accept language header', async () => {
    const home = url('/')
    const page = await createPage(undefined, { extraHTTPHeaders: { 'Accept-Language': 'fr' } })
    await page.goto(home)

    expect(await getText(page, '#msg')).toEqual('Bienvenue')
  })
})
