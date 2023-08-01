import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

describe('#1888', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/1888`, import.meta.url))
  })

  test('should be worked', async () => {
    const home = url('/')
    const page = await createPage(undefined, { locale: 'pl' })
    await page.goto(home)

    expect(await getText(page, '#html-msg')).toEqual('Przykład tłumaczenia')
    expect(await getText(page, '#html-msg-mounted')).toEqual('Przykład tłumaczenia')
    expect(await getText(page, '#test-msg')).toEqual('Przykład <strong>tłumaczenia</strong>')
    expect(await page.locator('#flag').getAttribute('alt')).toContain('pl')
    expect(await page.locator('#flag-mounted').getAttribute('alt')).toContain('pl')

    // change to `en` locale
    await page.locator('#en').click()

    expect(await getText(page, '#html-msg')).toEqual('Translation example')
    expect(await getText(page, '#html-msg-mounted')).toEqual('Translation example')
    expect(await getText(page, '#test-msg')).toEqual('<strong>Translation</strong> example')
    expect(await page.locator('#flag').getAttribute('alt')).toContain('us')
    expect(await page.locator('#flag-mounted').getAttribute('alt')).toContain('us')

    // change to `fr` locale
    await page.locator('#fr').click()

    expect(await getText(page, '#html-msg')).toEqual('Exemple de traduction')
    expect(await getText(page, '#html-msg-mounted')).toEqual('Exemple de traduction')
    expect(await getText(page, '#test-msg')).toEqual('Exemple de <strong>traduction</strong>')
    expect(await page.locator('#flag').getAttribute('alt')).toContain('fr')
    expect(await page.locator('#flag-mounted').getAttribute('alt')).toContain('fr')
  })
})
