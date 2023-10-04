import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

describe('#2473', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2473`, import.meta.url))
  })

  test('should be respected detect browser language', async () => {
    const home = url('/')
    const page = await createPage(undefined, { locale: 'fr' })
    await page.goto(home)

    expect(await getText(page, '#title')).toEqual(`Page d'accueil`)

    // change page
    await page.locator('#locale').click()
    expect(await getText(page, '#title')).toEqual(`À propos`)

    // one more change page
    await page.locator('#locale').click()
    expect(await getText(page, '#title')).toEqual(`Page d'accueil`)
  })
})
