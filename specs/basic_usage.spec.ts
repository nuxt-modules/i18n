import { beforeAll, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setTestContext, setup, $fetch, url, useTestContext } from './utils'
import { test, expect } from 'vitest'
import {
  assertLocaleHeadWithDom,
  assetLocaleHead,
  getDataFromDom,
  getDom,
  gotoPath,
  renderPage,
  setServerRuntimeConfig,
  startServerWithRuntimeConfig,
  waitForLocaleNetwork,
  waitForTransition
} from './helper'
import type { RouteLocation } from 'vue-router'

describe('basic usage', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`./fixtures/basic_usage`, import.meta.url)),
    browser: true,
    // overrides
    nuxtConfig: {
      runtimeConfig: {
        public: {
          i18n: {
            baseUrl: 'http://localhost:3000',
            skipSettingLocaleOnNavigate: undefined,
            detectBrowserLanguage: undefined
          }
        }
      }
    }
  })

  let ctx
  describe('general usage', async () => {
    test('basic usage', async () => {
      const { page } = await renderPage('/')

      // vue-i18n using
      expect(await page.locator('#vue-i18n-usage p').innerText()).toEqual('Welcome')

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
      expect(await page.locator('#nuxt-link-locale-usages .target-blank-with-locale a').getAttribute('href')).toEqual(
        '/fr/about'
      )

      expect(await page.evaluate(() => history.state.hello)).toEqual(undefined)
      await page.locator('#nuxt-link-locale-usages .state a').clickNavigate()
      expect(await page.evaluate(() => history.state.hello)).toEqual('world')
      await page.goBackNavigate()

      // Language switching path localizing with `useSwitchLocalePath`
      expect(await page.locator('#switch-locale-path-usages .switch-to-en a').getAttribute('href')).toEqual('/')
      expect(await page.locator('#switch-locale-path-usages .switch-to-fr a').getAttribute('href')).toEqual('/fr')

      // URL path with Route object with `useLocaleRoute`
      await page.locator('#locale-route-usages button').clickNavigate()
      expect(await page.locator('#profile-page').innerText()).toEqual('This is profile page')
      expect(await page.url()).include('/user/profile?foo=1')
    })

    test('(#3344) `availableLocales` includes all configured locales', async () => {
      const { page } = await renderPage('/')

      // @ts-expect-error runtime types
      expect(await page.evaluate(() => window.useNuxtApp?.().$i18n.availableLocales)).toMatchInlineSnapshot(`
      [
        "be",
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
      const pageDOM = await getDom(pageHTML)
      expect(await pageDOM.locator('#t-directive #t-directive-path')?.textContent()).toEqual('Welcome')
      expect(await pageDOM.locator('#t-directive #t-directive-argument')?.textContent()).toEqual('Hello directive!')

      const pageHTMLFrench = await $fetch('/fr')
      const pageDOMFrench = await getDom(pageHTMLFrench)
      expect(await pageDOMFrench.locator('#t-directive #t-directive-path')?.textContent()).toEqual('Bienvenue')
      expect(await pageDOMFrench.locator('#t-directive #t-directive-argument')?.textContent()).toEqual(
        'Bonjour directive!'
      )
    })

    test('nuxt context extension', async () => {
      const { page } = await renderPage('/nuxt-context-extension')

      expect(await page.locator('#get-route-base-name').innerText()).toEqual('nuxt-context-extension')
      expect(await page.locator('#get-route-base-name-string').innerText()).toEqual('nuxt-context-extension')
      expect(await page.locator('#switch-locale-path').innerText()).toEqual('/ja/nuxt-context-extension')
      expect(await page.locator('#locale-path').innerText()).toEqual('/nl/nuxt-context-extension')

      const localeRoute = JSON.parse(await page.locator('#locale-route').innerText()) as RouteLocation
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

      expect(await page.locator('#locale-head').innerText()).toMatchInlineSnapshot(
        `"{ "htmlAttrs": { "lang": "en" }, "link": [ { "id": "i18n-xd", "rel": "alternate", "href": "http://localhost:3000/nuxt-context-extension", "hreflang": "x-default" }, { "id": "i18n-alt-en", "rel": "alternate", "href": "http://localhost:3000/nuxt-context-extension", "hreflang": "en" }, { "id": "i18n-alt-fr", "rel": "alternate", "href": "http://localhost:3000/fr/nuxt-context-extension", "hreflang": "fr" }, { "id": "i18n-alt-ja", "rel": "alternate", "href": "http://localhost:3000/ja/nuxt-context-extension", "hreflang": "ja" }, { "id": "i18n-alt-ja-JP", "rel": "alternate", "href": "http://localhost:3000/ja/nuxt-context-extension", "hreflang": "ja-JP" }, { "id": "i18n-alt-nl", "rel": "alternate", "href": "http://localhost:3000/nl/nuxt-context-extension", "hreflang": "nl" }, { "id": "i18n-alt-nl-NL", "rel": "alternate", "href": "http://localhost:3000/nl/nuxt-context-extension", "hreflang": "nl-NL" }, { "id": "i18n-alt-nl-BE", "rel": "alternate", "href": "http://localhost:3000/be/nuxt-context-extension", "hreflang": "nl-BE" }, { "id": "i18n-alt-kr", "rel": "alternate", "href": "http://localhost:3000/kr/nuxt-context-extension", "hreflang": "kr" }, { "id": "i18n-alt-kr-KO", "rel": "alternate", "href": "http://localhost:3000/kr/nuxt-context-extension", "hreflang": "kr-KO" }, { "id": "i18n-can", "rel": "canonical", "href": "http://localhost:3000/nuxt-context-extension" } ], "meta": [ { "id": "i18n-og-url", "property": "og:url", "content": "http://localhost:3000/nuxt-context-extension" }, { "id": "i18n-og", "property": "og:locale", "content": "en" }, { "id": "i18n-og-alt-fr", "property": "og:locale:alternate", "content": "fr" }, { "id": "i18n-og-alt-ja-JP", "property": "og:locale:alternate", "content": "ja_JP" }, { "id": "i18n-og-alt-nl-NL", "property": "og:locale:alternate", "content": "nl_NL" }, { "id": "i18n-og-alt-nl-BE", "property": "og:locale:alternate", "content": "nl_BE" }, { "id": "i18n-og-alt-kr-KO", "property": "og:locale:alternate", "content": "kr_KO" } ] }"`
      )
    })

    test('register module hook', async () => {
      const { page } = await renderPage('/')

      expect(await page.locator('#register-module').innerText()).toEqual('This is a merged module layer locale key')

      // click `fr` lang switch link
      await page.locator('.switch-to-fr a').clickNavigate()
      await page.waitForURL(url('/fr'))

      expect(await page.locator('#register-module').innerText()).toEqual(
        'This is a merged module layer locale key in French'
      )
    })

    test('vueI18n config file can access runtimeConfig', async () => {
      const { page } = await renderPage('/')

      expect(await page.locator('#runtime-config').innerText()).toEqual('Hello from runtime config!')

      const restore = await startServerWithRuntimeConfig(
        { public: { runtimeValue: 'The environment variable has changed!' } },
        true
      )

      await gotoPath(page, '/')
      expect(await page.locator('#runtime-config').innerText()).toEqual('The environment variable has changed!')
      await restore()
    })

    test('layer provides locale `nl` and translation for key `hello`', async () => {
      const { page } = await renderPage('/layer-page')

      expect(await page.locator('#i18n-layer-target').innerText()).toEqual('Hello world!')
      expect(await page.locator('#i18n-layer-parent-link').getAttribute('href')).toEqual('/layer-parent')
      expect(await page.locator('#i18n-layer-parent-child-link').getAttribute('href')).toEqual(
        '/layer-parent/layer-child'
      )

      await gotoPath(page, '/nl/layer-page')
      expect(await page.locator('#i18n-layer-target').innerText()).toEqual('Hallo wereld!')
      expect(await page.locator('#i18n-layer-parent-link').getAttribute('href')).toEqual('/nl/layer-ouder')
      expect(await page.locator('#i18n-layer-parent-child-link').getAttribute('href')).toEqual(
        '/nl/layer-ouder/layer-kind'
      )
    })

    test('layer vueI18n options provides `nl` message', async () => {
      const { page } = await renderPage('/nl')

      expect(await page.locator('#layer-message').innerText()).toEqual('Bedankt!')
    })

    test('layer vueI18n options properties are merge and override by priority', async () => {
      const { page } = await renderPage('/')

      expect(await page.locator('#snake-case').innerText()).toEqual('About-this-site')
      expect(await page.locator('#pascal-case').innerText()).toEqual('AboutThisSite')

      await Promise.all([
        waitForLocaleNetwork(page, 'fr', 'response'),
        page.click(`#switch-locale-path-usages .switch-to-fr a`)
      ])
      await page.waitForTimeout(100)

      expect(await page.locator('#snake-case').innerText()).toEqual('À-propos-de-ce-site')
      expect(await page.locator('#pascal-case').innerText()).toEqual('ÀProposDeCeSite')
      expect(await page.locator('#fallback-message').innerText()).toEqual('Unique translation')
    })

    test('load option successfully', async () => {
      const { page } = await renderPage('/')

      // click `fr` lang switch link
      await page.locator('#switch-locale-path-usages .switch-to-fr a').clickNavigate()
      await page.waitForURL(url('/fr'))

      expect(await page.locator('#home-header').innerText()).toEqual('Bonjour-le-monde!')

      // click `en` lang switch link
      await page.locator('#switch-locale-path-usages .switch-to-en a').clickNavigate()
      await page.waitForURL(url('/'))
      expect(await page.locator('#home-header').innerText()).toEqual('Hello-world!')
    })

    test('(#1740) should be loaded vue-i18n related modules', async () => {
      const { page } = await renderPage('/')

      expect(await page.locator('#app-config-name').innerText()).toEqual('This is Nuxt layer')
    })

    test('fallback to target lang', async () => {
      const { page } = await renderPage('/')

      // `en` rendering
      expect(await page.locator('#locale-path-usages .name a').innerText()).toEqual('Homepage')
      expect(await page.locator('title').innerText()).toEqual('Page - Homepage')
      expect(await page.locator('#fallback-key').innerText()).toEqual('This is the fallback message!')

      // click `nl` lang switch with `<NuxtLink>`
      await page.locator('#switch-locale-path-usages .switch-to-nl a').clickNavigate()
      await page.waitForURL(url('/nl'))

      // fallback to en content translation
      expect(await page.locator('#locale-path-usages .name a').innerText()).toEqual('Homepage')
      expect(await page.locator('title').innerText()).toEqual('Page - Homepage')
      expect(await page.locator('#fallback-key').innerText()).toEqual('This is the fallback message!')

      // page path
      expect(JSON.parse(await page.locator('#home-use-async-data').innerText())).toMatchObject({
        aboutPath: '/nl/about'
      })

      // current locale
      expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('nl')
    })

    test('(#2525) localePath should keep hash', async () => {
      const { page } = await renderPage('/')

      expect(await page.locator('#link-about-hash').getAttribute('href')).toEqual('/about#my-hash')
      expect(await page.locator('#link-about-hash-object').getAttribute('href')).toEqual('/about#my-hash')

      expect(await page.locator('#link-about-query-hash').getAttribute('href')).toEqual('/about?foo=bar#my-hash')
      expect(await page.locator('#link-about-query-hash-object').getAttribute('href')).toEqual('/about?foo=bar#my-hash')

      // click `nl` lang switch with `<NuxtLink>`
      await page.locator('#switch-locale-path-usages .switch-to-nl a').clickNavigate()
      await page.waitForURL(url('/nl'))

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
      await page.locator('#switch-locale-path-usages .switch-to-nl a').clickNavigate()
      await page.waitForURL(url('/nl'))

      expect(await page.locator('#link-page-with-spaces').getAttribute('href')).toEqual(`/nl/${encodedPath}`)
      expect(await page.locator('#link-page-with-spaces-encoded').getAttribute('href')).toEqual(`/nl/${encodedPath}`)
    })

    test('(#2476) Parametrized messages can be overwritten', async () => {
      const { page } = await renderPage('/')

      expect(await page.locator('#module-layer-base-key').innerText()).toEqual('Layer base key overwritten!')
      expect(await page.locator('#module-layer-base-key-named').innerText()).toEqual(
        'Layer base key overwritten, greetings bar!'
      )
    })

    test('(#2338) should be extended API', async () => {
      const { page } = await renderPage('/')

      const globalData = JSON.parse(await page.locator('#global-scope-properties').innerText())
      expect(globalData.code).toEqual('en')
      const localeData = JSON.parse(await page.locator('#local-scope-properties').innerText())
      expect(localeData.code).toEqual('en')
    })

    test('<NuxtLink> triggers runtime hooks', async () => {
      const { page, consoleLogs } = await renderPage('/kr')

      await page.waitForFunction(() => !window.useNuxtApp?.().isHydrating)
      consoleLogs.length = 0

      // navigate to about page
      await page.locator('#link-about-en').clickNavigate()
      await page.waitForURL(url('/about'))

      expect(consoleLogs[0].text).toEqual('i18n:beforeLocaleSwitch fr en false')
      expect(consoleLogs[1].text).toEqual('i18n:localeSwitched fr en')
    })

    test('setLocale triggers runtime hooks', async () => {
      let output: string[] = []
      const ctx = useTestContext()
      ctx.serverProcess?.process?.on(
        'message',
        (msg: any) => msg.type === 'i18n:test-log' && msg.id === ctx.url?.split(':')[2]! && output.push(msg.data)
      )
      output.length = 0
      await new Promise(resolve => setTimeout(resolve, 1)) // wait for process to be ready

      const { page } = await renderPage('/kr')

      // overrides and redirects to `fr`
      // expect(output).toMatchInlineSnapshot(`
      //   [
      //     "i18n:beforeLocaleSwitch kr fr true",
      //     "i18n:localeSwitched kr fr",
      //     "i18n:beforeLocaleSwitch fr fr true",
      //   ]
      // `)

      // client-side enters on `fr` locale
      // expect(consoleLogs.find(log => log.text.includes('i18n:beforeLocaleSwitch fr fr true'))).toBeTruthy()

      // current locale
      expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')
    })

    test('render with meta components', async () => {
      const { page } = await renderPage('/')

      /**
       * default locale
       */

      // title tag
      expect(await page.locator('title').innerText()).toMatch('Page - Homepage')
      await page.waitForURL(url('/'))

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
      await page.locator('#nuxt-locale-link-fr').clickNavigate()
      await page.waitForURL(url('/fr'))

      // title tag
      expect(await page.locator('title').innerText()).toMatch('Page - Accueil')

      // html tag `lang` attribute
      expect(await page.getAttribute('html', 'lang')).toMatch('fr')

      // rendering link tag and meta tag in head tag
      await assetLocaleHead(page, '#layout-use-locale-head')

      /**
       * access to other page
       */

      // click about page
      await page.locator('#link-about').clickNavigate()
      await page.waitForURL(url('/fr/about'))

      // title tag
      expect(await page.locator('title').innerText()).toMatch('Page - À propos')

      // html tag `lang` attribute
      expect(await page.getAttribute('html', 'lang')).toMatch('fr')

      // rendering link tag and meta tag in head tag
      await assetLocaleHead(page, '#layout-use-locale-head')
    })

    test('render seo tags with baseUrl', async () => {
      const configDomain = 'https://runtime-config-domain.com'

      await setServerRuntimeConfig({
        public: {
          i18n: {
            baseUrl: configDomain
          }
        }
      })

      const html = await $fetch('/?noncanonical&canonical')
      const dom = await getDom(html)
      await assertLocaleHeadWithDom(dom, '#home-use-locale-head')

      const links = (await getDataFromDom(dom, '#home-use-locale-head')).link
      const i18nCan = links.find(x => x.id === 'i18n-can')
      expect(i18nCan.href).toContain(configDomain)
      expect(await dom.locator('#i18n-alt-fr')?.getAttribute('href')).toEqual(
        'https://runtime-config-domain.com/fr?canonical='
      )
    })

    test('render seo tags with `experimental.alternateLinkCanonicalQueries`', async () => {
      // head tags - alt links are updated server side
      const html = await $fetch('/?noncanonical&canonical')
      const dom = await getDom(html)
      expect(await dom.locator('link[id=i18n-alt-fr]')?.getAttribute('href')).toEqual(
        'http://localhost:3000/fr?canonical='
      )
    })

    test('respects `experimental.alternateLinkCanonicalQueries`', async () => {
      // head tags - alt links are updated server side
      const product1Html = await $fetch('/products/big-chair?test=123&canonical=123')
      const product1Dom = await getDom(product1Html)
      expect(await product1Dom.locator('link[id=i18n-alt-nl]')?.getAttribute('href')).toEqual(
        'http://localhost:3000/nl/products/grote-stoel?canonical=123'
      )
      expect(await product1Dom.locator('#switch-locale-path-link-nl')?.getAttribute('href')).toEqual(
        '/nl/products/grote-stoel?test=123&canonical=123'
      )

      const product2Html = await $fetch('/nl/products/rode-mok?test=123&canonical=123')
      const product2dom = await getDom(product2Html)
      expect(await product2dom.locator('link[id=i18n-alt-en]')?.getAttribute('href')).toEqual(
        'http://localhost:3000/products/red-mug?canonical=123'
      )
      expect(await product2dom.locator('#switch-locale-path-link-en')?.getAttribute('href')).toEqual(
        '/products/red-mug?test=123&canonical=123'
      )
    })

    test('dynamic parameters rendered correctly during SSR', async () => {
      // head tags - alt links are updated server side
      const product1Html = await $fetch('/products/big-chair')
      const product1Dom = await getDom(product1Html)
      expect(await product1Dom.locator('link[id=i18n-alt-nl]')?.getAttribute('href')).toEqual(
        'http://localhost:3000/nl/products/grote-stoel'
      )
      expect(await product1Dom.locator('#switch-locale-path-link-nl')?.getAttribute('href')).toEqual(
        '/nl/products/grote-stoel'
      )

      const product2Html = await $fetch('/nl/products/rode-mok')
      const product2dom = await getDom(product2Html)
      expect(await product2dom.locator('link[id=i18n-alt-en]')?.getAttribute('href')).toEqual(
        'http://localhost:3000/products/red-mug'
      )
      expect(await product2dom.locator('#switch-locale-path-link-en')?.getAttribute('href')).toEqual(
        '/products/red-mug'
      )
    })

    test('encode localized path to prevent XSS', async () => {
      const url = `/experimental//"><script>console.log('xss')</script><`

      const html = await $fetch(url)
      const dom = await getDom(html)

      // the localized should be the same as encoded
      expect(await dom.locator('#slp-xss a')?.getAttribute('href')).toEqual(encodeURI('/nl' + url))
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

      expect(await page.locator('#switch-locale-path-link-nl').getAttribute('href')).toEqual('/nl/products/grote-stoel')

      await gotoPath(page, '/nl/products/rode-mok')
      await page.waitForFunction(
        () => document.querySelector('#switch-locale-path-link-en')?.getAttribute('href') === '/products/red-mug'
      )
      expect(await page.locator('#switch-locale-path-link-en').getAttribute('href')).toEqual('/products/red-mug')

      // Translated params are not lost on query changes
      await page.locator('#params-add-query').clickNavigate()
      await page.waitForURL(url('/nl/products/rode-mok?test=123&canonical=123'))
      expect(await page.locator('#switch-locale-path-link-en').getAttribute('href')).toEqual(
        '/products/red-mug?test=123&canonical=123'
      )

      await page.locator('#params-remove-query').clickNavigate()
      await page.waitForURL(url('/nl/products/rode-mok'))
      expect(await page.locator('#switch-locale-path-link-en').getAttribute('href')).toEqual('/products/red-mug')

      // head tags - alt links are updated server side
      const product1Html = await $fetch('/products/big-chair')
      const product1Dom = await getDom(product1Html)
      expect(await product1Dom.locator('link[id=i18n-alt-nl]')?.getAttribute('href')).toEqual(
        'http://localhost:3000/nl/products/grote-stoel'
      )

      const product2Html = await $fetch('/nl/products/rode-mok')
      const product2dom = await getDom(product2Html)
      expect(await product2dom.locator('link[id=i18n-alt-en]')?.getAttribute('href')).toEqual(
        'http://localhost:3000/products/red-mug'
      )
    })

    test('(#2000) Should be able to load large vue-i18n messages', async () => {
      const restore = await startServerWithRuntimeConfig(
        {
          public: { longTextTest: true }
        },
        true
      )

      const { page } = await renderPage('/nl/long-text')

      expect(await page.locator('#long-text').innerText()).toEqual('hallo,'.repeat(8 * 500))
      await restore()
    })

    test('(#2094) vue-i18n messages are loaded from config exported as variable', async () => {
      const { page } = await renderPage('/')

      expect(await page.locator('#issue-2094').innerText()).toEqual('Exporting using variable identifier works!')
    })

    test('(#2726) composables correctly initialize common options, no internal server error', async () => {
      const html = await $fetch('/composables')
      const dom = await getDom(html)

      expect(await dom.locator('head #locale-path')?.getAttribute('content')).toEqual('/nested/test-route')
      expect(await dom.locator('head #locale-route')?.getAttribute('content')).toEqual('/nested/test-route')
      expect(await dom.locator('head #switch-locale-path')?.getAttribute('content')).toEqual('/fr/composables')
      expect(await dom.locator('head #route-base-name')?.getAttribute('content')).toEqual('nested-test-route')
    })

    test('(#2874) options `locales` and `vueI18n` passed using `installModule` are not overridden', async () => {
      const { page } = await renderPage('/')

      expect(await page.locator('#install-module-locale').innerText()).toEqual('Installer module locale works!')
      expect(await page.locator('#install-module-vue-i18n').innerText()).toEqual('Installer module vue-i18n works!')
    })

    test('can use `$t` in `<template>` with `autoDeclare``', async () => {
      const { consoleLogs } = await renderPage('/experimental/auto-import-translation-functions')

      const logStrings = consoleLogs.map(x => x.text)
      expect(logStrings).toContain('[autoDeclare][default]: Welcome')
      expect(logStrings).toContain('[autoDeclare][fr]: Bienvenue')
    })

    test('dynamic parameters render and update reactively client-side', async () => {
      const { page } = await renderPage('/products/big-chair')

      expect(await page.locator('#switch-locale-path-link-nl').getAttribute('href')).toEqual('/nl/products/grote-stoel')

      await gotoPath(page, '/nl/products/rode-mok')
      expect(await page.locator('#switch-locale-path-link-en').getAttribute('href')).toEqual('/products/red-mug')

      // Translated params are not lost on query changes
      await page.locator('#params-add-query').clickNavigate()
      await page.waitForURL(url('/nl/products/rode-mok?test=123&canonical=123'))
      expect(await page.locator('#switch-locale-path-link-en').getAttribute('href')).toEqual(
        '/products/red-mug?test=123&canonical=123'
      )

      await page.locator('#params-remove-query').clickNavigate()
      await page.waitForURL(url('/nl/products/rode-mok'))
      expect(await page.locator('#switch-locale-path-link-en').getAttribute('href')).toEqual('/products/red-mug')
    })

    test('(#3790) RegExp missingWarn', async () => {
      const { page } = await renderPage('/')

      // @ts-expect-error runtime types
      expect(await page.evaluate(() => window.useNuxtApp?.().$i18n.missingWarn)).toMatchInlineSnapshot(`/\\^foo/`)
    })

    ctx = useTestContext()
  })

  describe('language switching', async () => {
    beforeAll(async () => {
      setTestContext(ctx)
      await setServerRuntimeConfig(
        {
          public: {
            i18n: {
              skipSettingLocaleOnNavigate: true,
              detectBrowserLanguage: false
            }
          }
        },
        true
      )
    })

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

    test('(#3766) persists locale after hydration', async () => {
      const { page } = await renderPage('/fr')
      await page.waitForFunction(() => !window.useNuxtApp?.().isHydrating)
      expect(await page.locator('#lang-switcher-current-locale code').innerText()).toEqual('fr')
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
  })
})
