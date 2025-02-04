import { describe, test, expect, beforeEach } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch, setup } from './utils'
import {
  assertLocaleHeadWithDom,
  assetLocaleHead,
  getData,
  getDataFromDom,
  getDom,
  getText,
  gotoPath,
  renderPage,
  startServerWithRuntimeConfig,
  waitForTransition,
  waitForURL
} from './helper'
import { RouteLocation } from 'vue-router'

describe('basic usage', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`./fixtures/basic_usage`, import.meta.url)),
    browser: true,
    // prerender: true,
    // overrides
    nuxtConfig: {
      runtimeConfig: {
        public: {
          i18n: {
            baseUrl: 'http://localhost:3000',
            skipSettingLocaleOnNavigate: undefined,
            detectBrowserLanguage: undefined,
            experimental: {
              alternateLinkCanonicalQueries: false
            }
          }
        }
      }
    }
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
    await page.locator('#locale-route-usages button').click()
    // await page.waitForURL('**/user/profile?foo=1')
    expect(await getText(page, '#profile-page')).toEqual('This is profile page')
    expect(await page.url()).include('/user/profile?foo=1')
  })

  test('(#3344) `availableLocales` includes all configured locales', async () => {
    const { page } = await renderPage('/')

    // @ts-expect-error runtime types
    expect(await page.evaluate(() => window.useNuxtApp?.().$i18n.availableLocales)).toMatchInlineSnapshot(`
      [
        "en",
        "fr",
        "ja",
        "kr",
        "nl",
      ]
    `)
  })

  test('`v-t` directive SSR', async () => {
    const pageHTML = await $fetch('/')
    const pageDOM = getDom(pageHTML)
    expect(pageDOM.querySelector('#t-directive #t-directive-path')?.textContent).toEqual('Welcome')
    expect(pageDOM.querySelector('#t-directive #t-directive-argument')?.textContent).toEqual('Hello directive!')

    const pageHTMLFrench = await $fetch('/fr')
    const pageDOMFrench = getDom(pageHTMLFrench)
    expect(pageDOMFrench.querySelector('#t-directive #t-directive-path')?.textContent).toEqual('Bienvenue')
    expect(pageDOMFrench.querySelector('#t-directive #t-directive-argument')?.textContent).toEqual('Bonjour directive!')
  })

  test('nuxt context extension', async () => {
    const { page } = await renderPage('/nuxt-context-extension')

    expect(await getText(page, '#get-route-base-name')).toEqual('nuxt-context-extension')
    expect(await getText(page, '#switch-locale-path')).toEqual('/ja/nuxt-context-extension')
    expect(await getText(page, '#locale-path')).toEqual('/nl/nuxt-context-extension')

    const localeRoute = JSON.parse(await getText(page, '#locale-route')) as RouteLocation
    // remove properties that vary based on test environment and vue-router version
    // we only need to know if the correct route (object) is returned
    localeRoute.matched = localeRoute.matched.map(x => {
      for (const component in x.components) {
        x.components[component] = {}
      }
      // @ts-ignore
      delete x.mods
      return x
    })
    expect(localeRoute).toMatchInlineSnapshot(
      `
      {
        "fullPath": "/nuxt-context-extension",
        "hash": "",
        "href": "/nuxt-context-extension",
        "matched": [
          {
            "children": [],
            "components": {
              "default": {},
            },
            "enterCallbacks": {},
            "instances": {},
            "leaveGuards": {},
            "meta": {},
            "name": "nuxt-context-extension___en",
            "path": "/nuxt-context-extension",
            "props": {
              "default": false,
            },
            "updateGuards": {},
          },
        ],
        "meta": {},
        "name": "nuxt-context-extension___en",
        "params": {},
        "path": "/nuxt-context-extension",
        "query": {},
      }
    `
    )

    expect(await getText(page, '#locale-head')).toMatchInlineSnapshot(
      `"{ "htmlAttrs": { "lang": "en" }, "link": [ { "hid": "i18n-alt-en", "rel": "alternate", "href": "http://localhost:3000/nuxt-context-extension", "hreflang": "en" }, { "hid": "i18n-alt-fr", "rel": "alternate", "href": "http://localhost:3000/fr/nuxt-context-extension", "hreflang": "fr" }, { "hid": "i18n-alt-ja", "rel": "alternate", "href": "http://localhost:3000/ja/nuxt-context-extension", "hreflang": "ja" }, { "hid": "i18n-alt-ja-JP", "rel": "alternate", "href": "http://localhost:3000/ja/nuxt-context-extension", "hreflang": "ja-JP" }, { "hid": "i18n-alt-nl", "rel": "alternate", "href": "http://localhost:3000/nl/nuxt-context-extension", "hreflang": "nl" }, { "hid": "i18n-alt-nl-NL", "rel": "alternate", "href": "http://localhost:3000/nl/nuxt-context-extension", "hreflang": "nl-NL" }, { "hid": "i18n-alt-kr", "rel": "alternate", "href": "http://localhost:3000/kr/nuxt-context-extension", "hreflang": "kr" }, { "hid": "i18n-alt-kr-KO", "rel": "alternate", "href": "http://localhost:3000/kr/nuxt-context-extension", "hreflang": "kr-KO" }, { "hid": "i18n-xd", "rel": "alternate", "href": "http://localhost:3000/nuxt-context-extension", "hreflang": "x-default" }, { "hid": "i18n-can", "rel": "canonical", "href": "http://localhost:3000/nuxt-context-extension" } ], "meta": [ { "hid": "i18n-og-url", "property": "og:url", "content": "http://localhost:3000/nuxt-context-extension" }, { "hid": "i18n-og", "property": "og:locale", "content": "en" }, { "hid": "i18n-og-alt-fr", "property": "og:locale:alternate", "content": "fr" }, { "hid": "i18n-og-alt-ja-JP", "property": "og:locale:alternate", "content": "ja_JP" }, { "hid": "i18n-og-alt-nl-NL", "property": "og:locale:alternate", "content": "nl_NL" }, { "hid": "i18n-og-alt-kr-KO", "property": "og:locale:alternate", "content": "kr_KO" } ] }"`
    )
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

    const restore = await startServerWithRuntimeConfig({
      public: { runtimeValue: 'The environment variable has changed!' }
    })

    await gotoPath(page, '/')
    expect(await getText(page, '#runtime-config')).toEqual('The environment variable has changed!')

    await restore()
  })

  test('layer provides locale `nl` and translation for key `hello`', async () => {
    const { page } = await renderPage('/layer-page')

    expect(await getText(page, '#i18n-layer-target')).toEqual('Hello world!')
    expect(await page.locator('#i18n-layer-parent-link').getAttribute('href')).toEqual('/layer-parent')
    expect(await page.locator('#i18n-layer-parent-child-link').getAttribute('href')).toEqual(
      '/layer-parent/layer-child'
    )

    await gotoPath(page, '/nl/layer-page')
    expect(await getText(page, '#i18n-layer-target')).toEqual('Hallo wereld!')
    expect(await page.locator('#i18n-layer-parent-link').getAttribute('href')).toEqual('/nl/layer-ouder')
    expect(await page.locator('#i18n-layer-parent-child-link').getAttribute('href')).toEqual(
      '/nl/layer-ouder/layer-kind'
    )
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
    expect(await page.locator('#link-about-query-hash-object').getAttribute('href')).toEqual(
      '/nl/about?foo=bar#my-hash'
    )
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

    expect(consoleLogs.find(log => log.text.includes('onBeforeLanguageSwitch kr fr true'))).toBeTruthy()
    expect(consoleLogs.find(log => log.text.includes('onLanguageSwitched kr fr'))).toBeTruthy()
    expect(consoleLogs.find(log => log.text.includes('onBeforeLanguageSwitch fr fr false'))).toBeTruthy()

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

    expect(consoleLogs.find(log => log.text.includes('onBeforeLanguageSwitch kr fr true'))).toBeTruthy()
    expect(consoleLogs.find(log => log.text.includes('onLanguageSwitched kr fr'))).toBeTruthy()
    expect(consoleLogs.find(log => log.text.includes('onBeforeLanguageSwitch fr fr false'))).toBeTruthy()

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

  test('render seo tags with baseUrl', async () => {
    const configDomain = 'https://runtime-config-domain.com'

    const restore = await startServerWithRuntimeConfig({
      public: {
        i18n: {
          baseUrl: configDomain
        }
      }
    })

    const html = await $fetch('/?noncanonical&canonical')
    const dom = getDom(html)
    await assertLocaleHeadWithDom(dom, '#home-use-locale-head')

    const links = getDataFromDom(dom, '#home-use-locale-head').link
    const i18nCan = links.find(x => x.id === 'i18n-can')
    expect(i18nCan.href).toContain(configDomain)
    expect(dom.querySelector('#i18n-alt-fr').href).toEqual(
      'https://runtime-config-domain.com/fr?noncanonical&canonical'
    )

    await restore()
  })

  test('render seo tags with `experimental.alternateLinkCanonicalQueries`', async () => {
    const restore = await startServerWithRuntimeConfig({
      public: {
        i18n: {
          experimental: {
            alternateLinkCanonicalQueries: true
          }
        }
      }
    })

    // head tags - alt links are updated server side
    const html = await $fetch('/?noncanonical&canonical')
    const dom = getDom(html)
    expect(dom.querySelector('#i18n-alt-fr').href).toEqual('http://localhost:3000/fr?canonical=')

    await restore()
  })

  test('server integration extended from `layers/layer-server`', async () => {
    const res = await $fetch('/api/server', { query: { key: 'snakeCaseText' } })
    expect(res?.snakeCaseText).toMatch('About-this-site')

    // LocaleDetector: header
    const resHeader = await $fetch('/api/server', {
      query: { key: 'snakeCaseText' },
      headers: { 'Accept-Language': 'fr' }
    })
    expect(resHeader?.snakeCaseText).toMatch('À-propos-de-ce-site')

    // LocaleDetector: cookie
    const resCookie = await $fetch('/api/server', {
      query: { key: 'snakeCaseText' },
      headers: { cookie: 'i18n_locale=fr;' }
    })
    expect(resCookie?.snakeCaseText).toMatch('À-propos-de-ce-site')

    // LocaleDetector: query
    const resQuery = await $fetch('/api/server', { query: { key: 'snakeCaseText', locale: 'fr' } })
    expect(resQuery?.snakeCaseText).toMatch('À-propos-de-ce-site')

    // yaml, json5 resource
    const enRes = await $fetch('/api/server', { query: { key: 'server-key', locale: 'en' } })
    expect(enRes?.['server-key']).toMatch('Hello!')
    const jaRes = await $fetch('/api/server', { query: { key: 'server-key', locale: 'ja' } })
    expect(jaRes?.['server-key']).toMatch('こんにちは！')
  })

  test('dynamic parameters', async () => {
    const { page } = await renderPage('/products/big-chair')

    expect(await page.locator('#nuxt-locale-link-nl').getAttribute('href')).toEqual('/nl/products/grote-stoel')

    await gotoPath(page, '/nl/products/rode-mok')
    await page.waitForFunction(
      () => document.querySelector('#nuxt-locale-link-en')?.getAttribute('href') === '/products/red-mug'
    )
    expect(await page.locator('#nuxt-locale-link-en').getAttribute('href')).toEqual('/products/red-mug')

    // Translated params are not lost on query changes
    await page.locator('#params-add-query').click()
    await waitForURL(page, '/nl/products/rode-mok?test=123&canonical=123')
    expect(await page.locator('#nuxt-locale-link-en').getAttribute('href')).toEqual(
      '/products/red-mug?test=123&canonical=123'
    )

    await page.locator('#params-remove-query').click()
    await waitForURL(page, '/nl/products/rode-mok')
    expect(await page.locator('#nuxt-locale-link-en').getAttribute('href')).toEqual('/products/red-mug')

    // head tags - alt links are updated server side
    const product1Html = await $fetch('/products/big-chair')
    const product1Dom = getDom(product1Html)
    expect(product1Dom.querySelector('#i18n-alt-nl').href).toEqual('http://localhost:3000/nl/products/grote-stoel')

    const product2Html = await $fetch('/nl/products/rode-mok')
    const product2dom = getDom(product2Html)
    expect(product2dom.querySelector('#i18n-alt-en').href).toEqual('http://localhost:3000/products/red-mug')
  })

  describe('language switching', async () => {
    beforeEach(async () => {
      await startServerWithRuntimeConfig({
        public: {
          i18n: {
            skipSettingLocaleOnNavigate: true,
            detectBrowserLanguage: false
          }
        }
      })
    })

    test('language switching', async () => {
      const { page } = await renderPage('/')

      await page.locator('#nuxt-locale-link-fr').click()
      await waitForTransition(page)
      await waitForURL(page, '/fr')

      // `fr` rendering
      expect(await getText(page, '#home-header')).toMatch('Bonjour-le-monde!')
      expect(await getText(page, '#link-about')).toMatch('À propos')

      // lang switcher rendering
      expect(await getText(page, '#nuxt-locale-link-en')).toMatch('English')
      expect(await getText(page, '#set-locale-link-en')).toMatch('English')

      await page.locator('#set-locale-link-en').click()
      await waitForTransition(page)
      await waitForURL(page, '/')

      // page path
      expect(await getData(page, '#home-use-async-data')).toMatchObject({
        aboutPath: '/about',
        aboutTranslation: 'About us'
      })
      expect(await page.getAttribute('#nuxt-locale-link-fr', 'href')).toEqual('/fr')

      // current locale
      expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
    })

    test('retains query parameters', async () => {
      const { page } = await renderPage('/?foo=123')
      expect(page.url()).include('/?foo=123')

      await page.locator('#nuxt-locale-link-fr').click()
      await waitForTransition(page)
      await waitForURL(page, '/fr?foo=123')
      expect(page.url()).include('/fr?foo=123')
    })

    test('dynamic route parameters - basic', async () => {
      const { page } = await renderPage('/')

      // go to dynamic route page
      await page.locator('#link-post').click()
      await waitForTransition(page)
      await waitForURL(page, '/post/id')

      await page.locator('#nuxt-locale-link-fr').click()
      await waitForTransition(page)
      await waitForURL(page, '/fr/post/mon-article')
      expect(await getText(page, '#post-id')).toMatch('mon-article')
      expect(await page.url()).include('mon-article')
    })

    test('dynamic route parameters - catch all', async () => {
      const { page } = await renderPage('/foo/bar')

      await page.locator('#nuxt-locale-link-fr').click()
      await waitForTransition(page)
      await waitForURL(page, '/fr/mon-article/xyz')
      expect(await getText(page, '#catch-all-id')).toMatch('mon-article/xyz')
      expect(await page.url()).include('mon-article/xyz')
    })

    test('wait for page transition', async () => {
      const { page } = await renderPage('/')

      expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')

      // click `fr` lang switching
      await page.locator('#nuxt-locale-link-fr').click()
      await waitForTransition(page)
      await waitForURL(page, '/fr')
      expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('fr')

      // click `en` lang switching
      await page.locator('#nuxt-locale-link-en').click()
      await waitForTransition(page)
      await waitForURL(page, '/')
      expect(await getText(page, '#lang-switcher-current-locale code')).toEqual('en')
    })

    test('i18n custom block', async () => {
      const { page } = await renderPage('/')

      // click `fr` lang switch with `<NuxtLink>`
      await page.locator('#nuxt-locale-link-fr').click()
      await waitForTransition(page)

      // go to category page
      await page.locator('#link-greetings').click()
      await waitForTransition(page)

      expect(await getText(page, '#per-component-hello')).toMatch('Bonjour!')

      // click `en` lang switch with `<NuxtLink>`
      await page.locator('#nuxt-locale-link-en').click()
      await waitForTransition(page)

      expect(await getText(page, '#per-component-hello')).toMatch('Hello!')
    })
  })

  test('(#2000) Should be able to load large vue-i18n messages', async () => {
    const restore = await startServerWithRuntimeConfig({
      public: { longTextTest: true }
    })

    const { page } = await renderPage('/nl/long-text')

    expect(await getText(page, '#long-text')).toEqual('hallo,'.repeat(8 * 500))

    await restore()
  })

  test('(#2094) vue-i18n messages are loaded from config exported as variable', async () => {
    const { page } = await renderPage('/')

    expect(await getText(page, '#issue-2094')).toEqual('Exporting using variable identifier works!')
  })

  test('(#2726) composables correctly initialize common options, no internal server error', async () => {
    const html = await $fetch('/composables')
    const dom = getDom(html)

    expect(dom.querySelector('head #locale-path').content).toEqual('/nested/test-route')
    expect(dom.querySelector('head #locale-route').content).toEqual('/nested/test-route')
    expect(dom.querySelector('head #switch-locale-path').content).toEqual('/fr/composables')
    expect(dom.querySelector('head #route-base-name').content).toEqual('nested-test-route')
  })

  test('(#2874) options `locales` and `vueI18n` passed using `installModule` are not overridden', async () => {
    const { page } = await renderPage('/')

    expect(await getText(page, '#install-module-locale')).toEqual('Installer module locale works!')
    expect(await getText(page, '#install-module-vue-i18n')).toEqual('Installer module vue-i18n works!')
  })

  describe('experimental.autoImportTranslationFunctions', async () => {
    test('can use `$t` in `<template>`', async () => {
      const { consoleLogs } = await renderPage('/experimental/auto-import-translation-functions')

      const logStrings = consoleLogs.map(x => x.text)
      expect(logStrings).toContain('[autoImportTranslationFunctions][default]: Welcome')
      expect(logStrings).toContain('[autoImportTranslationFunctions][fr]: Bienvenue')
    })
  })
})
