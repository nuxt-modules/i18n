import { resolve } from 'path'
import { generate, setup, loadConfig, url, generatePort } from '@nuxtjs/module-test-utils'
import { chromium } from 'playwright-chromium'
import { startHttpServer } from './utils'

/** @typedef {any} Nuxt */

const browserString = process.env.BROWSER_STRING || 'chromium'

async function createBrowser () {
  return await chromium.launch()
}

/**
 * @param {import('playwright-chromium').Page} page
 * @param {string} path
 */
async function navigate (page, path) {
  await page.evaluate(path => {
    return new Promise((resolve, reject) => {
      window.$nuxt.$router.push(path, () => resolve(null), reject)
    })
  }, path)
  await new Promise(resolve => setTimeout(resolve, 50))
}

/** @param {import("playwright-chromium").Page} page */
async function getRouteFullPath (page) {
  return await page.evaluate(() => window.$nuxt.$route.fullPath)
}

describe(browserString, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page

  async function getTestData () {
    return await page.evaluate(() => {
      // @ts-ignore
      const languageSwitchedListeners = (window.testData && window.testData.languageSwitchedListeners) || []

      return {
        languageSwitchedListeners
      }
    })
  }

  beforeAll(async () => {
    const overrides = { plugins: ['~/plugins/i18n-hooks.js'] }
    nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }

    await nuxt.close()
  })

  test('navigate with SPA', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))

    expect(await (await page.$('body'))?.textContent()).toContain('page: Homepage')

    const aboutLink = await page.$('a[href="/about-us"]')
    expect(aboutLink).toBeDefined()

    await navigate(page, '/about-us')

    const aboutFrLink = await page.$('a[href="/fr/a-propos"]')
    expect(aboutFrLink).toBeDefined()

    await navigate(page, '/fr/a-propos')

    expect(await (await page.$('body'))?.textContent()).toContain('page: À propos')
  })

  test('changes route and locale with setLocale', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))

    let testData = await getTestData()
    expect(testData.languageSwitchedListeners).toEqual([])

    await page.click('#set-locale-link-fr')

    testData = await getTestData()
    expect(testData.languageSwitchedListeners).toEqual([
      {
        newLocale: 'fr',
        oldLocale: 'en'
      }
    ])
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
  })

  test('onLanguageSwitched listener triggers after locale was changed', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))

    let testData = await getTestData()
    expect(testData.languageSwitchedListeners).toEqual([])

    await navigate(page, '/fr/')

    testData = await getTestData()
    expect(testData.languageSwitchedListeners).toEqual([
      {
        newLocale: 'fr',
        oldLocale: 'en'
      }
    ])
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
  })

  test('APIs in app context work after SPA navigation', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))
    await navigate(page, '/middleware')

    expect(await (await page.$('#paths'))?.textContent()).toBe('/middleware,/fr/middleware-fr')
    expect(await (await page.$('#name'))?.textContent()).toBe('middleware')
    const routeObject = await (await page.$('#localizedRoute'))?.textContent() || '{}'
    expect(JSON.parse(routeObject)).toMatchObject({
      name: 'middleware___fr',
      fullPath: '/fr/middleware-fr'
    })
  })
})

describe(`${browserString}, target: static, trailingSlash: true`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page

  beforeAll(async () => {
    const overrides = {
      target: 'static',
      router: {
        trailingSlash: true
      },
      i18n: {
        parsePages: false,
        pages: {
          'about-no-locale': false
        }
      }
    }
    nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }

    await nuxt.close()
  })

  // Issue https://github.com/nuxt-community/i18n-module/issues/798
  // Not specific to trailingSlash === true
  test('does not trigger redirect loop on route with disabled locale', async () => {
    page = await browser.newPage()
    await page.goto(url('/about-no-locale/'), { waitUntil: 'load', timeout: 2000 })
    expect(await (await page.$('body'))?.textContent()).toContain('page: About us')
  })
})

for (const target of ['server', 'static']) {
  describe(`${browserString}, target ${target}, trailingSlash: true and strategy prefix`, () => {
    /** @type {Nuxt} */
    let nuxt
    /** @type {import('playwright-chromium').ChromiumBrowser} */
    let browser

    beforeAll(async () => {
      const overrides = {
        target,
        router: {
          trailingSlash: true
        },
        i18n: {
          defaultLocale: 'en',
          strategy: 'prefix'
        }
      }
      nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
      browser = await createBrowser()
    })

    afterAll(async () => {
      if (browser) {
        await browser.close()
      }

      await nuxt.close()
    })

    // Issue https://github.com/nuxt-community/i18n-module/issues/1204
    test('redirects from root (404) path to default locale while preserving query', async () => {
      const page = await browser.newPage()
      await page.goto(url('/?key=value'))
      expect(await (await page.$('body'))?.textContent()).toContain('locale: en')
      expect(await getRouteFullPath(page)).toBe('/en/?key=value')
    })

    test('redirects from root (404) path to default locale while preserving query and hash', async () => {
      const page = await browser.newPage()
      await page.goto(url('/?key=value#hash'))
      expect(await (await page.$('body'))?.textContent()).toContain('locale: en')
      expect(await getRouteFullPath(page)).toBe('/en/?key=value#hash')
    })
  })
}

describe(`${browserString} (generate, with router base) + redirectOn is root`, () => {
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page
  /** @type {import('./utils').StaticServer} */
  let server

  beforeAll(async () => {
    const base = '/nuxt/'
    const distDir = resolve(__dirname, 'fixture', 'basic', '.nuxt-generate')
    const overrides = {
      generate: { dir: distDir },
      router: { base }
    }
    await generate(loadConfig(__dirname, 'basic', overrides, { merge: true }))
    server = await startHttpServer({ path: distDir, base, verbose: true })
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (server) {
      await server.destroy()
    }
    if (browser) {
      await browser.close()
    }
  })

  // Issue https://github.com/nuxt-community/i18n-module/issues/378
  test('navigate to non-default locale', async () => {
    page = await browser.newPage()
    await page.goto(server.getUrl('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')

    await navigate(page, '/fr')
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')

    await navigate(page, '/')
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')
  })

  // Issue https://github.com/nuxt-community/i18n-module/issues/737
  test('reactivity works after redirecting to detected browser locale (root path)', async () => {
    page = await browser.newPage({ locale: 'fr' })
    await page.goto(server.getUrl('/'))
    // Trailing slash added by the server.
    expect(page.url()).toBe(server.getUrl('/fr/'))
    // Need to delay a bit due to vue-meta batching with 10ms timeout.
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Accueil')

    await navigate(page, '/')
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Homepage')
  })

  test('reactivity works after redirecting to locale (sub-path)', async () => {
    page = await browser.newPage({ locale: 'fr' })
    await page.goto(server.getUrl('/posts/'))
    expect(page.url()).toBe(server.getUrl('/posts/'))
    // Need to delay a bit due to vue-meta batching with 10ms timeout.
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Posts')

    await navigate(page, '/fr/articles/')
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Articles')
  })

  test('localePath returns correct path', async () => {
    page = await browser.newPage()
    await page.goto(server.getUrl('/'))
    /**
     * @param {string} route
     * @param {string | undefined} [locale]
     */
    const localePath = async (route, locale) => {
      // @ts-ignore
      return await page.evaluate(args => window.$nuxt.localePath(...args), [route, locale])
    }
    expect(await localePath('about')).toBe('/about-us')
    expect(await localePath('about', 'fr')).toBe('/fr/a-propos')
    expect(await localePath('/about-us')).toBe('/about-us')
  })
})

describe(`${browserString} (generate, with router base) + redirectOn is all`, () => {
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page
  /** @type {import('./utils').StaticServer} */
  let server

  beforeAll(async () => {
    const base = '/nuxt/'
    const distDir = resolve(__dirname, 'fixture', 'basic', '.nuxt-generate')
    const overrides = {
      generate: { dir: distDir },
      router: { base },
      i18n: {
        detectBrowserLanguage: {
          redirectOn: 'all'
        }
      }
    }
    await generate(loadConfig(__dirname, 'basic', overrides, { merge: true }))
    server = await startHttpServer({ path: distDir, base, verbose: true })
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (server) {
      await server.destroy()
    }
    if (browser) {
      await browser.close()
    }
  })

  // Issue https://github.com/nuxt-community/i18n-module/issues/378
  test('navigate to non-default locale', async () => {
    page = await browser.newPage()
    await page.goto(server.getUrl('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')

    await navigate(page, '/fr')
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')

    await navigate(page, '/')
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')
  })

  // Issue https://github.com/nuxt-community/i18n-module/issues/737
  test('reactivity works after redirecting to detected browser locale (root path)', async () => {
    page = await browser.newPage({ locale: 'fr' })
    await page.goto(server.getUrl('/'))
    // Trailing slash added by the server.
    expect(page.url()).toBe(server.getUrl('/fr/'))
    // Need to delay a bit due to vue-meta batching with 10ms timeout.
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Accueil')

    await navigate(page, '/')
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Homepage')
  })

  test('reactivity works after redirecting to detected browser locale (sub-path)', async () => {
    page = await browser.newPage({ locale: 'fr' })
    await page.goto(server.getUrl('/posts/'))
    expect(page.url()).toBe(server.getUrl('/fr/articles/'))
    // Need to delay a bit due to vue-meta batching with 10ms timeout.
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Articles')

    await navigate(page, '/posts/')
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Posts')
  })

  test('localePath returns correct path', async () => {
    page = await browser.newPage()
    await page.goto(server.getUrl('/'))
    /**
     * @param {string} route
     * @param {string | undefined} [locale]
     */
    const localePath = async (route, locale) => {
      // @ts-ignore
      return await page.evaluate(args => window.$nuxt.localePath(...args), [route, locale])
    }
    expect(await localePath('about')).toBe('/about-us')
    expect(await localePath('about', 'fr')).toBe('/fr/a-propos')
    expect(await localePath('/about-us')).toBe('/about-us')
  })
})

describe(`${browserString} (generate, no subFolders, trailingSlash === false) + redirectOn is root`, () => {
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page
  /** @type {import('./utils').StaticServer} */
  let server

  beforeAll(async () => {
    const distDir = resolve(__dirname, 'fixture', 'basic', '.nuxt-generate')
    const overrides = {
      generate: {
        dir: distDir,
        subFolders: false
      },
      router: {
        trailingSlash: false
      }
    }
    await generate(loadConfig(__dirname, 'basic', overrides, { merge: true }))
    server = await startHttpServer({ path: distDir, noTrailingSlashRedirect: true, verbose: true })
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (server) {
      await server.destroy()
    }
    if (browser) {
      await browser.close()
    }
  })

  test('navigate to non-default locale', async () => {
    page = await browser.newPage()
    await page.goto(server.getUrl('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')

    await navigate(page, '/fr')
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')

    await navigate(page, '/')
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')
  })

  test('reactivity works after redirecting to detected browser locale (root path)', async () => {
    page = await browser.newPage({ locale: 'fr' })
    await page.goto(server.getUrl('/'))
    expect(page.url()).toBe(server.getUrl('/fr'))
    // Need to delay a bit due to vue-meta batching with 10ms timeout.
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Accueil')

    await navigate(page, '/')
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Homepage')
  })

  test('reactivity works after redirecting to locale (sub-path)', async () => {
    page = await browser.newPage({ locale: 'fr' })
    await page.goto(server.getUrl('/dynamicNested'))
    expect(page.url()).toBe(server.getUrl('/dynamicNested'))
    // Need to delay a bit due to vue-meta batching with 10ms timeout.
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Dynamic')

    await navigate(page, '/fr/imbrication-dynamique')
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Dynamique')
  })
})

describe(`${browserString} (generate, no subFolders, trailingSlash === false) + redirectOn is all`, () => {
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page
  /** @type {import('./utils').StaticServer} */
  let server

  beforeAll(async () => {
    const distDir = resolve(__dirname, 'fixture', 'basic', '.nuxt-generate')
    const overrides = {
      generate: {
        dir: distDir,
        subFolders: false
      },
      router: {
        trailingSlash: false
      },
      i18n: {
        detectBrowserLanguage: {
          redirectOn: 'all'
        }
      }
    }
    await generate(loadConfig(__dirname, 'basic', overrides, { merge: true }))
    server = await startHttpServer({ path: distDir, noTrailingSlashRedirect: true, verbose: true })
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (server) {
      await server.destroy()
    }
    if (browser) {
      await browser.close()
    }
  })

  test('navigate to non-default locale', async () => {
    page = await browser.newPage()
    await page.goto(server.getUrl('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')

    await navigate(page, '/fr')
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')

    await navigate(page, '/')
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')
  })

  test('reactivity works after redirecting to detected browser locale (root path)', async () => {
    page = await browser.newPage({ locale: 'fr' })
    await page.goto(server.getUrl('/'))
    expect(page.url()).toBe(server.getUrl('/fr'))
    // Need to delay a bit due to vue-meta batching with 10ms timeout.
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Accueil')

    await navigate(page, '/')
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Homepage')
  })

  test('reactivity works after redirecting to detected browser locale (sub-path)', async () => {
    page = await browser.newPage({ locale: 'fr' })
    await page.goto(server.getUrl('/dynamicNested'))
    expect(page.url()).toBe(server.getUrl('/fr/imbrication-dynamique'))
    // Need to delay a bit due to vue-meta batching with 10ms timeout.
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Dynamique')

    await navigate(page, '/dynamicNested')
    await page.waitForTimeout(20)
    expect(await page.title()).toBe('Dynamic')
  })
})

for (const target of ['server', 'static']) {
  describe(`${browserString} (target ${target}, generate, prefix strategy, alwaysRedirect, redirectOn is root)`, () => {
    /** @type {import('playwright-chromium').ChromiumBrowser} */
    let browser
    /** @type {import('playwright-chromium').Page} */
    let page
    /** @type {import('./utils').StaticServer} */
    let server

    beforeAll(async () => {
      const distDir = resolve(__dirname, 'fixture', 'basic', '.nuxt-generate')
      const overrides = {
        target,
        generate: { dir: distDir },
        i18n: {
          strategy: 'prefix',
          detectBrowserLanguage: {
            alwaysRedirect: true,
            fallbackLocale: 'en',
            redirectOn: 'root'
          }
        }
      }
      await generate(loadConfig(__dirname, 'basic', overrides, { merge: true }))
      server = await startHttpServer({ path: distDir, verbose: true })
      browser = await createBrowser()
    })

    afterAll(async () => {
      if (server) {
        await server.destroy()
      }
      if (browser) {
        await browser.close()
      }
    })

    // Issue https://github.com/nuxt-community/i18n-module/issues/700
    test('non-prefixed routes are generated for redirect purposes', async () => {
      page = await browser.newPage()
      await page.goto(server.getUrl('/'))
      expect(await (await page.$('body'))?.textContent()).toContain('locale: en')

      await navigate(page, '/about')
      expect(await (await page.$('body'))?.textContent()).toContain('page: About us')
    })

    // Issue https://github.com/nuxt-community/i18n-module/issues/887
    test('redirects to saved locale on re-visiting the root path', async () => {
      page = await browser.newPage()
      await page.goto(server.getUrl('/fr'))
      expect(page.url()).toBe(server.getUrl('/fr/'))
      expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')

      await page.goto(server.getUrl('/'))
      expect(page.url()).toBe(server.getUrl('/fr/'))
      expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
    })
  })
}

describe(`${browserString} (generate with detectBrowserLanguage.fallbackLocale)`, () => {
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page
  /** @type {import('./utils').StaticServer} */
  let server

  beforeAll(async () => {
    const distDir = resolve(__dirname, 'fixture', 'basic', '.nuxt-generate')

    const overrides = {
      generate: { dir: distDir },
      i18n: {
        detectBrowserLanguage: {
          fallbackLocale: 'en'
        }
      }
    }

    await generate(loadConfig(__dirname, 'basic', overrides, { merge: true }))

    server = await startHttpServer({ path: distDir, verbose: true })
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (server) {
      await server.destroy()
    }
    if (browser) {
      await browser.close()
    }
  })

  test('generates pages in all locales', async () => {
    page = await browser.newPage()
    await page.goto(server.getUrl('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')

    await navigate(page, '/fr')
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
  })

  test('redirects to browser locale', async () => {
    page = await browser.newPage({ locale: 'fr' })
    await page.goto(server.getUrl('/'))
    expect(page.url()).toBe(server.getUrl('/fr/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
  })
})

describe(`${browserString} (no fallbackLocale, browser language not supported)`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page

  beforeAll(async () => {
    const overrides = {
      i18n: {
        defaultLocale: 'pl',
        detectBrowserLanguage: {
          fallbackLocale: null
        },
        vueI18n: {
          messages: {
            pl: {
              home: 'Strona glowna',
              about: 'O stronie',
              posts: 'Artykuly'
            },
            no: {
              home: 'Hjemmeside',
              about: 'Om oss',
              posts: 'Artikkeler'
            }
          },
          fallbackLocale: null
        }
      }
    }

    const localConfig = loadConfig(__dirname, 'basic', overrides, { merge: true })

    // Override after merging options to avoid arrays being merged.
    localConfig.i18n.locales = [
      { code: 'pl', iso: 'pl-PL' },
      { code: 'no', iso: 'no-NO' }
    ]

    nuxt = (await setup(localConfig)).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }

    await nuxt.close()
  })

  // Browser language is 'en' and so doesn't match supported ones.
  // Issue https://github.com/nuxt-community/i18n-module/issues/643
  test('updates language after navigating from default to non-default locale', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: pl')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Strona glowna')
    await navigate(page, '/no')
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: no')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Hjemmeside')
  })

  // Issue https://github.com/nuxt-community/i18n-module/issues/843
  test('updates language after navigating from non-default to default locale', async () => {
    page = await browser.newPage()
    await page.goto(url('/no'))
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: no')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Hjemmeside')
    await navigate(page, '/')
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: pl')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Strona glowna')
  })
})

describe(`${browserString} (no fallbackLocale, browser language not supported, lazy)`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page

  beforeAll(async () => {
    const overrides = {
      i18n: {
        defaultLocale: 'pl',
        lazy: true,
        langDir: 'lang/',
        detectBrowserLanguage: {
          fallbackLocale: null
        },
        vueI18n: {
          fallbackLocale: null
        }
      }
    }

    const localConfig = loadConfig(__dirname, 'basic', overrides, { merge: true })

    // Override after merging options to avoid arrays being merged.
    localConfig.i18n.locales = [
      { code: 'pl', iso: 'pl-PL', file: 'pl-PL.json' },
      { code: 'no', iso: 'no-NO', file: 'no-NO.json' }
    ]

    nuxt = (await setup(localConfig)).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }

    await nuxt.close()
  })

  // Browser language is 'en' and so doesn't match supported ones.
  // Issue https://github.com/nuxt-community/i18n-module/issues/643
  test('updates language after navigating from default to non-default locale', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: pl')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Strona glowna')
    await navigate(page, '/no')
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: no')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Hjemmeside')
  })

  // Issue https://github.com/nuxt-community/i18n-module/issues/843
  test('updates language after navigating from non-default to default locale', async () => {
    page = await browser.newPage()
    await page.goto(url('/no'))
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: no')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Hjemmeside')
    await navigate(page, '/')
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: pl')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Strona glowna')
  })

  test('current locale messages have been passed through Nuxt state', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))
    // @ts-ignore
    const i18nState = await page.evaluate(() => window.__NUXT__.__i18n)
    expect(Object.keys(i18nState.langs)).toEqual(['pl'])
  })
})

describe(`${browserString} (with fallbackLocale, lazy)`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page

  beforeAll(async () => {
    const overrides = {
      i18n: {
        defaultLocale: 'pl',
        lazy: true,
        langDir: 'lang/',
        vueI18n: {
          fallbackLocale: 'pl'
        }
      }
    }

    const localConfig = loadConfig(__dirname, 'basic', overrides, { merge: true })

    // Override after merging options to avoid arrays being merged.
    localConfig.i18n.locales = [
      { code: 'en', iso: 'en-US', file: 'en-US.js' },
      { code: 'pl', iso: 'pl-PL', file: 'pl-PL.json' },
      { code: 'no', iso: 'no-NO', file: 'no-NO.json' }
    ]

    nuxt = (await setup(localConfig)).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }

    await nuxt.close()
  })

  // Browser language is 'en' and so doesn't match supported ones.
  // Issue https://github.com/nuxt-community/i18n-module/issues/643
  test('updates language after navigating from default to non-default locale', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: pl')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Strona glowna')
    await navigate(page, '/no')
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: no')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Hjemmeside')
  })

  // Issue https://github.com/nuxt-community/i18n-module/issues/843
  test('updates language after navigating from non-default to default locale', async () => {
    page = await browser.newPage()
    await page.goto(url('/no'))
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: no')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Hjemmeside')
    await navigate(page, '/')
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: pl')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Strona glowna')
  })

  test('fallbackLocale messages have not been passed through Nuxt state', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))
    // @ts-ignore
    const i18nState = await page.evaluate(() => window.__NUXT__.__i18n)
    expect(Object.keys(i18nState.langs)).toEqual([])
  })

  test('current (non-fallback) locale messages have been passed through Nuxt state', async () => {
    page = await browser.newPage()
    await page.goto(url('/no'))
    // @ts-ignore
    const i18nState = await page.evaluate(() => window.__NUXT__.__i18n)
    expect(Object.keys(i18nState.langs).sort()).toEqual(['no'])
  })

  test('message function results in failing to set Nuxt state for locale', async () => {
    page = await browser.newPage()
    await page.goto(url('/en'))
    // @ts-ignore
    const i18nState = await page.evaluate(() => window.__NUXT__.__i18n)
    expect(Object.keys(i18nState.langs)).toEqual([])
    // The message function should work when loaded directly through client-side.
    expect(await (await page.$('#message-function'))?.textContent()).toBe('Demo string')
  })
})

describe(`${browserString} (lazy with { skipNuxtState: true} )`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page

  beforeAll(async () => {
    const overrides = {
      i18n: {
        defaultLocale: 'pl',
        lazy: { skipNuxtState: true },
        langDir: 'lang/',
        vueI18n: {
          fallbackLocale: 'pl'
        }
      }
    }

    const localConfig = loadConfig(__dirname, 'basic', overrides, { merge: true })

    // Override after merging options to avoid arrays being merged.
    localConfig.i18n.locales = [
      { code: 'en', iso: 'en-US', file: 'en-US.js' },
      { code: 'pl', iso: 'pl-PL', file: 'pl-PL.json' },
      { code: 'no', iso: 'no-NO', file: 'no-NO.json' }
    ]

    nuxt = (await setup(localConfig)).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }

    await nuxt.close()
  })

  test('current locale messages have not been passed through Nuxt state', async () => {
    page = await browser.newPage()
    await page.goto(url('/no'))
    // @ts-ignore
    const i18nState = await page.evaluate(() => window.__NUXT__.__i18n)
    expect(i18nState).toBeUndefined()
  })
})

describe(`${browserString} (with fallbackLocale, langDir, non-lazy)`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page

  beforeAll(async () => {
    const overrides = {
      i18n: {
        defaultLocale: 'pl',
        lazy: false,
        langDir: 'lang/',
        vueI18n: {
          fallbackLocale: 'pl'
        }
      }
    }

    const localConfig = loadConfig(__dirname, 'basic', overrides, { merge: true })

    // Override after merging options to avoid arrays being merged.
    localConfig.i18n.locales = [
      { code: 'en', iso: 'en-US', file: 'en-US.js' },
      { code: 'pl', iso: 'pl-PL', file: 'pl-PL.json' },
      { code: 'no', iso: 'no-NO', file: 'no-NO.json' }
    ]

    nuxt = (await setup(localConfig)).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }

    await nuxt.close()
  })

  // Browser language is 'en' and so doesn't match supported ones.
  // Issue https://github.com/nuxt-community/i18n-module/issues/643
  test('updates language after navigating from default to non-default locale', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: pl')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Strona glowna')
    await navigate(page, '/no')
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: no')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Hjemmeside')
  })

  // Issue https://github.com/nuxt-community/i18n-module/issues/843
  test('updates language after navigating from non-default to default locale', async () => {
    page = await browser.newPage()
    await page.goto(url('/no'))
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: no')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Hjemmeside')
    await navigate(page, '/')
    expect(await (await page.$('#current-locale'))?.textContent()).toBe('locale: pl')
    expect(await (await page.$('#current-page'))?.textContent()).toBe('page: Strona glowna')
  })

  test('messages have not been passed through Nuxt state', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))
    // @ts-ignore
    const i18nState = await page.evaluate(() => window.__NUXT__.__i18n)
    expect(i18nState).toBeUndefined()
  })

  test('can resolve translation for non-current locale', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))
    expect(await (await page.$('#english-translation'))?.textContent()).toBe('Homepage')
  })
})

describe(`${browserString} (SPA)`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page

  beforeAll(async () => {
    const overrides = {
      mode: 'spa'
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }

    await nuxt.close()
  })

  test('renders existing page', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')
  })

  test('renders 404 page', async () => {
    page = await browser.newPage()
    await page.goto(url('/nopage'))
    expect(await (await page.$('body'))?.textContent()).toContain('page could not be found')
  })

  test('preserves the URL on 404 page', async () => {
    const path = '/nopage?a#h'
    page = await browser.newPage()
    await page.goto(url(path))
    expect(await (await page.$('body'))?.textContent()).toContain('page could not be found')
    expect(await getRouteFullPath(page)).toBe(path)
  })

  test('preserves the URL on 404 page with non-default locale', async () => {
    const path = '/nopage?a#h'
    page = await browser.newPage({ locale: 'fr' })
    await page.goto(url(path))
    expect(await (await page.$('body'))?.textContent()).toContain('page could not be found')
    expect(await getRouteFullPath(page)).toBe(path)
  })
})

describe(`${browserString} (SPA with router in hash mode)`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  /** @type {import('playwright-chromium').Page} */
  let page

  beforeAll(async () => {
    const overrides = {
      mode: 'spa',
      router: {
        mode: 'hash'
      },
      i18n: {
        detectBrowserLanguage: false
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }

    await nuxt.close()
  })

  // Issue https://github.com/nuxt-community/i18n-module/issues/490
  test('navigates directly to page with trailing slash', async () => {
    page = await browser.newPage()
    await page.goto(url('/#/fr/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
  })

  test('navigates directly to page with query', async () => {
    page = await browser.newPage()
    await page.goto(url('/#/fr?a=1'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
  })
})

describe(`${browserString} (redirectOn is root + alwaysRedirect + no_prefix)`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser

  beforeAll(async () => {
    const overrides = {
      i18n: {
        defaultLocale: 'en',
        strategy: 'no_prefix',
        detectBrowserLanguage: {
          useCookie: false,
          alwaysRedirect: true,
          redirectOn: 'root'
        }
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    await nuxt.close()
  })

  test('redirectOn is root does not affect locale detection on root path', async () => {
    const page = await browser.newPage({ locale: 'fr' })
    await page.goto(url('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
  })

  test('redirectOn is root does not affect locale detection on sub-path', async () => {
    const page = await browser.newPage({ locale: 'fr' })
    await page.goto(url('/about'))
    expect(await (await page.$('#current-page'))?.textContent()).toContain('page: À propos')
    // Custom paths are not supported in "no_prefix" strategy.
    // expect(await getRouteFullPath(page)).toBe('/a-propos')
  })

  test('localeProperties is reactive', async () => {
    const page = await browser.newPage()
    await page.goto(url('/about'))
    expect(await (await page.$('#locale-properties-code'))?.textContent()).toBe('code: en')
    await page.click('#set-locale-link-fr')
    expect(await (await page.$('#locale-properties-code'))?.textContent()).toBe('code: fr')
  })
})

describe(`${browserString} (alwaysRedirect, prefix)`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser

  beforeAll(async () => {
    const overrides = {
      i18n: {
        defaultLocale: 'en',
        strategy: 'prefix',
        detectBrowserLanguage: {
          useCookie: true,
          alwaysRedirect: true
        }
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    await nuxt.close()
  })

  // This seems like a wrong behavior with `alwaysRedirect` enabled...
  test('does not redirect to default locale on navigation', async () => {
    const page = await browser.newPage()
    await page.goto(url('/'))
    await navigate(page, '/fr')
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
  })
})

describe(`${browserString} (redirectOn is root + prefix_except_default)`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser

  beforeAll(async () => {
    const overrides = {
      i18n: {
        defaultLocale: 'en',
        strategy: 'prefix_except_default',
        detectBrowserLanguage: {
          redirectOn: 'root'
        }
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    await nuxt.close()
  })

  test('redirects to detected locale on unprefixed root path', async () => {
    const page = await browser.newPage({ locale: 'fr' })
    await page.goto(url('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
  })

  test('does not detect locale and redirect on unprefixed non-root path', async () => {
    const page = await browser.newPage({ locale: 'fr' })
    await page.goto(url('/simple'))
    expect(await (await page.$('#container'))?.textContent()).toContain('Homepage')
    expect(await getRouteFullPath(page)).toBe('/simple')
  })

  test('does not detect locale and redirect on prefixed, root path', async () => {
    const page = await browser.newPage({ locale: 'en' })
    await page.goto(url('/fr/'))
    expect(await (await page.$('#current-page'))?.textContent()).toContain('page: Accueil')
    expect(await getRouteFullPath(page)).toBe('/fr/')
  })

  test('does not detect locale and redirect on prefixed, non-root path', async () => {
    const page = await browser.newPage({ locale: 'en' })
    await page.goto(url('/fr/a-propos'))
    expect(await (await page.$('#current-page'))?.textContent()).toContain('page: À propos')
    expect(await getRouteFullPath(page)).toBe('/fr/a-propos')
  })

  test('does not redirect to locale stored in cookie on second navigation to root path', async () => {
    const page = await browser.newPage({ locale: 'fr' })
    await page.goto(url('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
    expect(await getRouteFullPath(page)).toBe('/fr')
    const browserContext = page.context()
    // Verify that cookie was set.
    const cookies = await browserContext.cookies()
    expect(cookies).toMatchObject([{ name: 'i18n_redirected', value: 'fr' }])
    // Navigate again to root, expecting to NOT be redirected again.
    await page.goto(url('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')
    expect(await getRouteFullPath(page)).toBe('/')
  })
})

describe(`${browserString} (redirectOn is root + alwaysRedirect + prefix_except_default)`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser

  beforeAll(async () => {
    const overrides = {
      i18n: {
        defaultLocale: 'en',
        strategy: 'prefix_except_default',
        detectBrowserLanguage: {
          alwaysRedirect: true,
          redirectOn: 'root'
        }
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    await nuxt.close()
  })

  test('redirects to locale stored in cookie on second navigation to root path', async () => {
    const page = await browser.newPage({ locale: 'fr' })
    await page.goto(url('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
    expect(await getRouteFullPath(page)).toBe('/fr')
    const browserContext = page.context()
    // Verify that cookie was set.
    const cookies = await browserContext.cookies()
    expect(cookies).toMatchObject([{ name: 'i18n_redirected', value: 'fr' }])
    // Navigate again to root, expecting to be redirected again.
    await page.goto(url('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
    expect(await getRouteFullPath(page)).toBe('/fr')
  })
})

describe(`${browserString} (redirectOn is root + prefix_and_default)`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser

  beforeAll(async () => {
    const overrides = {
      i18n: {
        defaultLocale: 'en',
        strategy: 'prefix_and_default',
        detectBrowserLanguage: {
          redirectOn: 'root'
        }
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    await nuxt.close()
  })

  test('redirects from prefixed to unprefixed default locale', async () => {
    const page = await browser.newPage()
    await page.goto(url('/en'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')
    expect(await getRouteFullPath(page)).toBe('/')
  })

  test('does not redirect from unprefixed default locale', async () => {
    const page = await browser.newPage()
    await page.goto(url('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')
    expect(await getRouteFullPath(page)).toBe('/')
  })
})

describe(`${browserString} (redirectOn is root + prefix)`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser

  beforeAll(async () => {
    const overrides = {
      i18n: {
        defaultLocale: 'en',
        strategy: 'prefix',
        detectBrowserLanguage: {
          redirectOn: 'root'
        }
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    await nuxt.close()
  })

  test('does not redirect from one locale to another', async () => {
    const page = await browser.newPage({ locale: 'fr' })
    await page.goto(url('/en'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')
    expect(await getRouteFullPath(page)).toBe('/en')
  })

  test('redirects from root (404) path to default locale', async () => {
    const page = await browser.newPage()
    await page.goto(url('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')
    expect(await getRouteFullPath(page)).toBe('/en')
  })

  test('uses saved locale cookie when redirecting from root', async () => {
    const page = await browser.newPage({ locale: 'fr' })

    // Ensure the detected locale cookie is saved
    await page.goto(url('/fr'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
    expect(await getRouteFullPath(page)).toBe('/fr')

    // Verify that we navigate to saved locale
    await page.goto(url('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
    expect(await getRouteFullPath(page)).toBe('/fr')
  })
})

describe(`${browserString} (vuex disabled)`, () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser

  beforeAll(async () => {
    const overrides = {
      i18n: {
        vuex: false,
        detectBrowserLanguage: false
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    await nuxt.close()
  })

  test('navigates to route with correct locale', async () => {
    const page = await browser.newPage()
    await page.goto(url('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: en')

    const page2 = await browser.newPage()
    await page2.goto(url('/fr'))
    expect(await (await page2.$('body'))?.textContent()).toContain('locale: fr')
  })
})

describe('differentDomains', () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  let port

  beforeAll(async () => {
    port = await generatePort()
    const overrides = {
      i18n: {
        detectBrowserLanguage: false,
        differentDomains: true,
        vuex: false
      }
    }

    const localConfig = loadConfig(__dirname, 'basic', overrides, { merge: true })

    // Override after merging options to avoid arrays being merged.
    localConfig.i18n.locales = [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
        domain: 'en.nuxt-app.localhost'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français',
        // Since we can't use custom domain in browser test, we'll make FR locale match the used one.
        domain: `localhost:${port}`
      }
    ]

    nuxt = (await setup(localConfig, { port })).nuxt
    browser = await createBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    await nuxt.close()
  })

  test('navigates to route with correct locale', async () => {
    const page = await browser.newPage()
    await page.goto(url('/'))
    expect(await (await page.$('body'))?.textContent()).toContain('locale: fr')
  })
})
