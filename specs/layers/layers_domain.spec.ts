import { describe, test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

describe('nuxt layers-domain', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
    browser: true,
    // overrides
    nuxtConfig: {
      extends: [fileURLToPath(new URL(`../fixtures/layers/layer-domain`, import.meta.url))]
    }
  })

  test('layer overrides domain for locale `fr`', async () => {
    const home = url('/')
    const page = await createPage(undefined, { locale: 'ja' }) // set browser locale
    await page.goto(home)

    // French link uses layer domain configuration
    expect(await getText(page, '#navigate-locale-link-fr')).toEqual('Français')
    expect(await page.locator('#navigate-locale-link-fr').getAttribute('href')).toContain('layer-fr.example.com')

    // English link uses project domain configuration, overrides layer
    expect(await getText(page, '#navigate-locale-link-en')).toEqual('English')
    expect(await page.locator('#navigate-locale-link-en').getAttribute('href')).toContain('project-en.example.com')

    // Dutch link uses project domain configuration, overrides layer with undefined
    // expect(await getText(page, '#navigate-locale-link-nl')).toEqual('Nederlands')
    // expect(await page.locator('#navigate-locale-link-nl').getAttribute('href')).toContain('/nl')
  })
})
