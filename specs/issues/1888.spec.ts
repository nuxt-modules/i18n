import { test, expect, describe } from 'vitest'
import { fileURLToPath, URL } from 'node:url'
import { setup, url, createPage } from '../utils'
import { waitForLocaleSwitch } from '../helper'

describe('#1888', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/1888`, import.meta.url)),
  })

  test('should be worked', async () => {
    const page = await createPage(undefined, { locale: 'pl' })
    await page.goto(url('/'))

    const htmlMsg = page.locator('#html-msg')
    const htmlMsgMounted = page.locator('#html-msg-mounted')
    const testMsg = page.locator('#test-msg')
    const flag = page.locator('#flag')
    const flagMounted = page.locator('#flag-mounted')

    expect(await htmlMsg.innerText()).toEqual('Przykład tłumaczenia')
    expect(await htmlMsgMounted.innerText()).toEqual('Przykład tłumaczenia')
    expect(await testMsg.innerText()).toEqual('Przykład <strong>tłumaczenia</strong>')
    expect(await flag.getAttribute('alt')).toContain('pl')
    expect(await flagMounted.getAttribute('alt')).toContain('pl')

    // change to `en` locale
    await Promise.all([waitForLocaleSwitch(page), page.locator('#en').click()])

    expect(await htmlMsg.innerText()).toEqual('Translation example')
    expect(await htmlMsgMounted.innerText()).toEqual('Translation example')
    expect(await testMsg.innerText()).toEqual('<strong>Translation</strong> example')
    expect(await flag.getAttribute('alt')).toContain('us')
    expect(await flagMounted.getAttribute('alt')).toContain('us')

    // change to `fr` locale
    await Promise.all([waitForLocaleSwitch(page), page.locator('#fr').click()])

    expect(await htmlMsg.innerText()).toEqual('Exemple de traduction')
    expect(await htmlMsgMounted.innerText()).toEqual('Exemple de traduction')
    expect(await testMsg.innerText()).toEqual('Exemple de <strong>traduction</strong>')
    expect(await flag.getAttribute('alt')).toContain('fr')
    expect(await flagMounted.getAttribute('alt')).toContain('fr')
  })
})
