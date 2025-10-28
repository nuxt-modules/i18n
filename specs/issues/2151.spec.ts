import { test, describe, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from '../utils'
import { gotoPath, renderPage } from '../helper'

describe('#2151', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2151`, import.meta.url)),
    browser: true
  })

  test('should load resources with `autoImport` disabled', async () => {
    const { page } = await renderPage('/', { locale: 'ja' })

    const msg = page.locator('#msg')
    expect(await msg.innerText()).toEqual('日本語のメッセージ')

    await gotoPath(page, '/en')
    expect(await msg.innerText()).toEqual('English message')
  })
})
