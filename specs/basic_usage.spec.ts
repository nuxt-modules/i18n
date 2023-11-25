import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from './utils'
import { assetLocaleHead, getData, getText, gotoPath, renderPage, waitForURL } from './helper'

await setup({
  rootDir: fileURLToPath(new URL(`./fixtures/basic_usage`, import.meta.url)),
  browser: true,
  // prerender: true,
  // overrides
  nuxtConfig: {}
})

test('basic usage', async () => {
  const { page } = await renderPage('/')

  // vue-i18n using
  expect(await getText(page, '#vue-i18n-usage p')).toEqual('Welcome')

  // URL path localizing with `useLocalePath`
  expect(await page.locator('#locale-path-usages .name a').getAttribute('href')).toEqual('/')
  expect(await page.locator('#locale-path-usages .path a').getAttribute('href')).toEqual('/')
  expect(await page.locator('#locale-path-usages .named-with-locale a').getAttribute('href')).toEqual('/fr')
  expect(await page.locator('#locale-path-usages .nest-path a').getAttribute('href')).toEqual('/user/profile')
  expect(await page.locator('#locale-path-usages .nest-named a').getAttribute('href')).toEqual('/user/profile')
  expect(await page.locator('#locale-path-usages .object-with-named a').getAttribute('href')).toEqual(
    '/category/nintendo'
  )

  // URL path localizing with `NuxtLinkLocale`
  expect(await page.locator('#nuxt-link-locale-usages .name a').getAttribute('href')).toEqual('/')
  expect(await page.locator('#nuxt-link-locale-usages .path a').getAttribute('href')).toEqual('/')
  expect(await page.locator('#nuxt-link-locale-usages .named-with-locale a').getAttribute('href')).toEqual('/fr')
  expect(await page.locator('#nuxt-link-locale-usages .nest-path a').getAttribute('href')).toEqual('/user/profile')
  expect(await page.locator('#nuxt-link-locale-usages .nest-named a').getAttribute('href')).toEqual('/user/profile')
  expect(await page.locator('#nuxt-link-locale-usages .object-with-named a').getAttribute('href')).toEqual(
    '/category/nintendo'
  )
  expect(await page.locator('#nuxt-link-locale-usages .external-url a').getAttribute('href')).toEqual(
    'https://nuxt.com/'
  )

  // Language switching path localizing with `useSwitchLocalePath`
  expect(await page.locator('#switch-locale-path-usages .switch-to-en a').getAttribute('href')).toEqual('/')
  expect(await page.locator('#switch-locale-path-usages .switch-to-fr a').getAttribute('href')).toEqual('/fr')

  // URL path with Route object with `useLocaleRoute`
  const button = await page.locator('#locale-route-usages button')
  await button.click()
  // await page.waitForURL('**/user/profile?foo=1')
  expect(await getText(page, '#profile-page')).toEqual('This is profile page')
  expect(await page.url()).include('/user/profile?foo=1')
})

test('register module hook', async () => {
  const { page } = await renderPage('/')

  expect(await getText(page, '#register-module')).toEqual('This is a merged module layer locale key')

  // click `fr` lang switch link
  await page.locator('.switch-to-fr a').click()
  await waitForURL(page, '/fr')

  expect(await getText(page, '#register-module')).toEqual('This is a merged module layer locale key in French')
})

test('vueI18n config file can access runtimeConfig', async () => {
  const { page } = await renderPage('/')

  expect(await getText(page, '#runtime-config')).toEqual('Hello from runtime config!')
})

test('layer provides locale `nl` and translation for key `hello`', async () => {
  const { page } = await renderPage('/layer-page')

  expect(await getText(page, '#i18n-layer-target')).toEqual('Hello world!')
  expect(await page.locator('#i18n-layer-parent-link').getAttribute('href')).toEqual('/layer-parent')
  expect(await page.locator('#i18n-layer-parent-child-link').getAttribute('href')).toEqual('/layer-parent/layer-child')

  await gotoPath(page, '/nl/layer-page')
  expect(await getText(page, '#i18n-layer-target')).toEqual('Hallo wereld!')
  expect(await page.locator('#i18n-layer-parent-link').getAttribute('href')).toEqual('/nl/layer-ouder')
  expect(await page.locator('#i18n-layer-parent-child-link').getAttribute('href')).toEqual('/nl/layer-ouder/layer-kind')
})

test('layer vueI18n options provides `nl` message', async () => {
  const { page } = await renderPage('/nl')

  expect(await getText(page, '#layer-message')).toEqual('Bedankt!')
})

test('layer vueI18n options properties are merge and override by priority', async () => {
  const { page } = await renderPage('/')

  expect(await getText(page, '#snake-case')).toEqual('About-this-site')
  expect(await getText(page, '#pascal-case')).toEqual('AboutThisSite')

  await page.click(`#switch-locale-path-usages .switch-to-fr a`)
  await waitForURL(page, '/fr')
  expect(await getText(page, '#snake-case')).toEqual('À-propos-de-ce-site')
  expect(await getText(page, '#pascal-case')).toEqual('ÀProposDeCeSite')
  expect(await getText(page, '#fallback-message')).toEqual('Unique translation')
})

test('load option successfully', async () => {
  const { page } = await renderPage('/')

  // click `fr` lang switch link
  await page.locator('#switch-locale-path-usages .switch-to-fr a').click()
  await waitForURL(page, '/fr')

  expect(await getText(page, '#home-header')).toEqual('Bonjour-le-monde!')

  // click `en` lang switch link
  await page.locator('#switch-locale-path-usages .switch-to-en a').click()
  await waitForURL(page, '/')
  expect(await getText(page, '#home-header')).toEqual('Hello-world!')
})

test('(#1740) should be loaded vue-i18n related modules', async () => {
  const { page } = await renderPage('/')

  expect(await getText(page, '#app-config-name')).toEqual('This is Nuxt layer')
})

test('fallback to target lang', async () => {
  const { page } = await renderPage('/')

  // `en` rendering
  expect(await getText(page, '#locale-path-usages .name a')).toEqual('Homepage')
  expect(await getText(page, 'title')).toEqual('Page - Homepage')
  expect(await getText(page, '#fallback-key')).toEqual('This is the fallback message!')

  // click `nl` lang switch with `<NuxtLink>`
  await page.locator('#switch-locale-path-usages .switch-to-nl a').click()
  await waitForURL(page, '/nl')

  // fallback to en content translation
  expect(await getText(page, '#locale-path-usages .name a')).toEqual('Homepage')
  expect(await getText(page, 'title')).toEqual('Page - Homepage')
  expect(await getText(page, '#fallback-key')).toEqual('This is the fallback message!')

  // page path
  expect(await getData(page, '#home-use-async-data')).toMatchObject({ aboutPath: '/nl/about' })

  // current locale
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('nl')
})

test('(#2525) localePath should keep hash', async () => {
  const { page } = await renderPage('/')

  expect(await page.locator('#link-about-hash').getAttribute('href')).toEqual('/about#my-hash')
  expect(await page.locator('#link-about-hash-object').getAttribute('href')).toEqual('/about#my-hash')

  expect(await page.locator('#link-about-query-hash').getAttribute('href')).toEqual('/about?foo=bar#my-hash')
  expect(await page.locator('#link-about-query-hash-object').getAttribute('href')).toEqual('/about?foo=bar#my-hash')

  // click `nl` lang switch with `<NuxtLink>`
  await page.locator('#switch-locale-path-usages .switch-to-nl a').click()
  await waitForURL(page, '/nl')

  expect(await page.locator('#link-about-hash').getAttribute('href')).toEqual('/nl/about#my-hash')
  expect(await page.locator('#link-about-hash-object').getAttribute('href')).toEqual('/nl/about#my-hash')

  expect(await page.locator('#link-about-query-hash').getAttribute('href')).toEqual('/nl/about?foo=bar#my-hash')
  expect(await page.locator('#link-about-query-hash-object').getAttribute('href')).toEqual('/nl/about?foo=bar#my-hash')
})

test('(#2523) localePath should not double encode paths', async () => {
  const { page } = await renderPage('/')
  const encodedPath = encodeURI('page with spaces')

  expect(await page.locator('#link-page-with-spaces').getAttribute('href')).toEqual(`/${encodedPath}`)
  expect(await page.locator('#link-page-with-spaces-encoded').getAttribute('href')).toEqual(`/${encodedPath}`)

  // click `nl` lang switch with `<NuxtLink>`
  await page.locator('#switch-locale-path-usages .switch-to-nl a').click()
  await waitForURL(page, '/nl')

  expect(await page.locator('#link-page-with-spaces').getAttribute('href')).toEqual(`/nl/${encodedPath}`)
  expect(await page.locator('#link-page-with-spaces-encoded').getAttribute('href')).toEqual(`/nl/${encodedPath}`)
})

test('(#2476) Parametrized messages can be overwritten', async () => {
  const { page } = await renderPage('/')

  expect(await getText(page, '#module-layer-base-key')).toEqual('Layer base key overwritten!')
  expect(await getText(page, '#module-layer-base-key-named')).toEqual('Layer base key overwritten, greetings bar!')
})

test('(#2338) should be extended API', async () => {
  const { page } = await renderPage('/')

  const globalData = await getData(page, '#global-scope-properties')
  expect(globalData.code).toEqual('en')
  const localeData = await getData(page, '#local-scope-properties')
  expect(localeData.code).toEqual('en')
})

test('<NuxtLink> triggers runtime hooks', async () => {
  const { page, consoleLogs } = await renderPage('/kr')

  // click `fr` lang switch with `<NuxtLink>`
  await page.locator('#nuxt-locale-link-fr').click()
  await waitForURL(page, '/fr')

  // click `kr` lang switch with `<NuxtLink>`
  await page.locator('#nuxt-locale-link-kr').click()
  await waitForURL(page, '/kr')

  expect(consoleLogs.find(log => log.text.includes('onBeforeLanguageSwitch kr fr true'))).toBeTruthy()
  expect(consoleLogs.find(log => log.text.includes('onBeforeLanguageSwitch fr kr false'))).toBeTruthy()
  expect(consoleLogs.find(log => log.text.includes('onLanguageSwitched kr fr'))).toBeTruthy()

  // current locale
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

  // navigate to about page
  await page.locator('#link-about').click()
  await waitForURL(page, '/fr/about')

  // navigate to home page
  await page.locator('#link-home').click()
  await waitForURL(page, '/fr')
})

test('setLocale triggers runtime hooks', async () => {
  const { page, consoleLogs } = await renderPage('/kr')

  // click `fr` lang switch link
  await page.locator('#set-locale-link-fr').click()

  // click `kr` lang switch link
  // Hook prevents locale change to `kr`, stays `fr`
  await page.locator('#set-locale-link-kr').click()
  expect(consoleLogs.find(log => log.text.includes('onBeforeLanguageSwitch kr fr true'))).toBeTruthy()
  expect(consoleLogs.find(log => log.text.includes('onLanguageSwitched kr fr'))).toBeTruthy()
  expect(consoleLogs.find(log => log.text.includes('onBeforeLanguageSwitch fr kr false'))).toBeTruthy()

  // current locale
  expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')
})

test('render with meta components', async () => {
  const { page } = await renderPage('/')

  /**
   * default locale
   */

  // title tag
  expect(await getText(page, 'title')).toMatch('Page - Homepage')
  await waitForURL(page, '/')

  // html tag `lang` attribute
  expect(await page.getAttribute('html', 'lang')).toMatch('en')

  // html tag `dir` attribute
  expect(await page.getAttribute('html', 'dir')).toMatch('ltr')

  // rendering link tag and meta tag in head tag
  await assetLocaleHead(page, '#layout-use-locale-head')

  /**
   * change locale
   */

  // click `fr` lang switch link
  await page.locator('#nuxt-locale-link-fr').click()
  await waitForURL(page, '/fr')

  // title tag
  expect(await getText(page, 'title')).toMatch('Page - Accueil')

  // html tag `lang` attribute
  expect(await page.getAttribute('html', 'lang')).toMatch('fr')

  // rendering link tag and meta tag in head tag
  await assetLocaleHead(page, '#layout-use-locale-head')

  /**
   * access to other page
   */

  // click about page
  await page.locator('#link-about').click()
  await waitForURL(page, '/fr/about')

  // title tag
  expect(await getText(page, 'title')).toMatch('Page - À propos')

  // html tag `lang` attribute
  expect(await page.getAttribute('html', 'lang')).toMatch('fr')

  // rendering link tag and meta tag in head tag
  await assetLocaleHead(page, '#layout-use-locale-head')
})
