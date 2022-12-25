import { test, describe, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, createPage, url } from '@nuxt/test-utils'
import { getText } from '../helper'

describe('#1740', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/1740`, import.meta.url)),
    browser: true
  })

  test('should be loaded vue-i18n related modules', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    expect(await getText(page, '#render')).toEqual('This is Nuxt layer')
  })
})
