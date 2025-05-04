import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup, url, createPage } from '../utils'
import { waitForLocaleSwitch } from '../helper'

describe('#1888', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/1888`, import.meta.url))
  })

  test('should be worked', async () => {
    const home = url('/')
    const page = await createPage(undefined, { locale: 'pl' })
    await page.goto(home)

    expect(await page.locator('#html-msg').innerText()).toEqual('Przykład tłumaczenia')
    expect(await page.locator('#html-msg-mounted').innerText()).toEqual('Przykład tłumaczenia')
    expect(await page.locator('#test-msg').innerText()).toEqual('Przykład <strong>tłumaczenia</strong>')
    expect(await page.locator('#flag').getAttribute('alt')).toContain('pl')
    expect(await page.locator('#flag-mounted').getAttribute('alt')).toContain('pl')

    // change to `en` locale
    await Promise.all([waitForLocaleSwitch(page), page.locator('#en').click()])

    expect(await page.locator('#html-msg').innerText()).toEqual('Translation example')
    expect(await page.locator('#html-msg-mounted').innerText()).toEqual('Translation example')
    expect(await page.locator('#test-msg').innerText()).toEqual('<strong>Translation</strong> example')
    expect(await page.locator('#flag').getAttribute('alt')).toContain('us')
    expect(await page.locator('#flag-mounted').getAttribute('alt')).toContain('us')

    // change to `fr` locale
    await Promise.all([waitForLocaleSwitch(page), page.locator('#fr').click()])

    expect(await page.locator('#html-msg').innerText()).toEqual('Exemple de traduction')
    expect(await page.locator('#html-msg-mounted').innerText()).toEqual('Exemple de traduction')
    expect(await page.locator('#test-msg').innerText()).toEqual('Exemple de <strong>traduction</strong>')
    expect(await page.locator('#flag').getAttribute('alt')).toContain('fr')
    expect(await page.locator('#flag-mounted').getAttribute('alt')).toContain('fr')
  })
})
