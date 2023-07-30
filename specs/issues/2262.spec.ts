import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

describe('#2262', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2262`, import.meta.url))
  })

  test('redirect with browser cookie', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)
    const ctx = await page.context()

    expect(await getText(page, '#msg')).toEqual('Welcome')

    // change to `fr`
    await page.locator('#fr').click()
    expect(await getText(page, '#msg')).toEqual('Bienvenue')
    expect(await ctx.cookies()).toMatchObject([{ name: 'i18n_redirected', value: 'fr' }])

    // direct access to root `/`
    await page.goto(home)
    expect(await getText(page, '#msg')).toEqual('Bienvenue')
    expect(page.url().endsWith('/fr'))

    // change to `en`
    await page.locator('#en').click()
    expect(await getText(page, '#msg')).toEqual('Welcome')
    expect(await ctx.cookies()).toMatchObject([{ name: 'i18n_redirected', value: 'en' }])
  })
})
