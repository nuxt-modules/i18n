import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

describe('nuxt layers vuei18n options', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/layer_consumer`, import.meta.url)),
    browser: true
  })

  test('layer vueI18n options provides `nl` message', async () => {
    const home = url('/')
    const page = await createPage(undefined)
    await page.goto(home)

    expect(await getText(page, '#layer-message')).toEqual('Bedankt!')
  })

  test('layer vueI18n options properties are merge and override by priority', async () => {
    const home = url('/')
    const page = await createPage(undefined)
    await page.goto(home)

    // Wait for load, VueI18n messages with modifiers are not supported with jit compilation
    await page.waitForLoadState('load')

    expect(await getText(page, '#snake-case')).toEqual('Over-deze-site')
    expect(await getText(page, '#pascal-case')).toEqual('OverDezeSite')

    await page.click(`#set-locale-link-en`)
    expect(await getText(page, '#snake-case')).toEqual('About-this-site')
    expect(await getText(page, '#pascal-case')).toEqual('AboutThisSite')

    await page.click(`#set-locale-link-fr`)
    expect(await getText(page, '#snake-case')).toEqual('À-propos-de-ce-site')
    expect(await getText(page, '#pascal-case')).toEqual('ÀProposDeCeSite')
  })
})
