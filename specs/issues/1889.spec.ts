import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, createPage, url } from '../utils'
import { getText } from '../helper'

describe('#1889', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/1889`, import.meta.url))
  })

  test('navigate work on `defineI18nRoute(false)`', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    // switch 'pl' locale
    await page.locator('#pl').click()
    expect(await getText(page, '#hello-text')).toEqual('Witaj!')

    // navigate to disabled route
    await page.locator('#disabled-route').click()
    expect(await getText(page, '#disable-route-text')).toEqual('Page with disabled localized route')

    // back to home
    await page.locator('#goto-home').click()
    expect(await getText(page, '#hello-text')).toEqual('Witaj!')
  })
})
