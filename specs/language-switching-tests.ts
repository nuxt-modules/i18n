import { test, expect } from 'vitest'
import { renderPage, waitForTransition } from './helper'
import { url } from './utils'

export function languageSwitchingTests() {
  test('language switching', async () => {
    const { page } = await renderPage('/')

    await page.locator('#nuxt-locale-link-fr').clickNavigate()
    await waitForTransition(page)
    await page.waitForURL(url('/fr'))

    // `fr` rendering
    expect(await page.locator('#home-header').innerText()).toMatch('Bonjour-le-monde!')
    expect(await page.locator('#link-about').innerText()).toMatch('À propos')

    // lang switcher rendering
    expect(await page.locator('#nuxt-locale-link-en').innerText()).toMatch('English')
    expect(await page.locator('#set-locale-link-en').innerText()).toMatch('English')

    await page.locator('#set-locale-link-en').clickNavigate()
    await waitForTransition(page)
    await page.waitForURL(url('/'))

    // page path
    expect(JSON.parse(await page.locator('#home-use-async-data').innerText())).toMatchObject({
      aboutPath: '/about',
      aboutTranslation: 'About us'
    })
    expect(await page.getAttribute('#nuxt-locale-link-fr', 'href')).toEqual('/fr')

    // current locale
    expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('en')
  })

  test('retains query parameters', async () => {
    const { page } = await renderPage('/?foo=123')
    await page.waitForURL(url('/?foo=123'))

    await page.locator('#nuxt-locale-link-fr').clickNavigate()
    await waitForTransition(page)
    await page.waitForURL(url('/fr?foo=123'))
  })

  test('dynamic route parameters - basic', async () => {
    const { page } = await renderPage('/')

    // go to dynamic route page
    await page.locator('#link-post').clickNavigate()
    await waitForTransition(page)
    await page.waitForURL(url('/post/id'))

    await page.locator('#nuxt-locale-link-fr').clickNavigate()
    await waitForTransition(page)
    await page.waitForURL(url('/fr/post/mon-article'))
    expect(await page.locator('#post-id').innerText()).toMatch('mon-article')
  })

  test('dynamic route parameters - catch all', async () => {
    const { page } = await renderPage('/foo/bar')

    await page.locator('#nuxt-locale-link-fr').clickNavigate()
    await waitForTransition(page)
    await page.waitForURL(url('/fr/mon-article/xyz'))
    expect(await page.locator('#catch-all-id').innerText()).toMatch('mon-article/xyz')
  })

  test('wait for page transition', async () => {
    const { page } = await renderPage('/')

    expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('en')

    // click `fr` lang switching
    await page.locator('#nuxt-locale-link-fr').clickNavigate()
    await waitForTransition(page)
    await page.waitForURL(url('/fr'))
    expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')

    // click `en` lang switching
    await page.locator('#nuxt-locale-link-en').clickNavigate()
    await waitForTransition(page)
    await page.waitForURL(url('/'))
    expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('en')
  })

  test('i18n custom block', async () => {
    const { page } = await renderPage('/')

    // click `fr` lang switch with `<NuxtLink>`
    await page.locator('#nuxt-locale-link-fr').clickNavigate()
    await waitForTransition(page)

    // go to category page
    await page.locator('#link-greetings').clickNavigate()
    await waitForTransition(page)

    expect(await page.locator('#per-component-hello').innerText()).toMatch('Bonjour!')

    // click `en` lang switch with `<NuxtLink>`
    await page.locator('#nuxt-locale-link-en').clickNavigate()
    await waitForTransition(page)

    expect(await page.locator('#per-component-hello').innerText()).toMatch('Hello!')
  })
}
