import { resolve } from 'path'
import { generate, setup, loadConfig, url } from '@nuxtjs/module-test-utils'
import { chromium } from 'playwright-chromium'
import { startHttpServer } from './utils'

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
      window.$nuxt.$router.push(path, () => resolve(), reject)
    })
  }, path)
  await new Promise(resolve => setTimeout(resolve, 50))
}

async function getRouteFullPath (page) {
  return await page.evaluate(() => window.$nuxt.$route.fullPath)
}

describe(browserString, () => {
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  let page

  async function getTestData () {
    return await page.evaluate(() => {
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

    expect(await (await page.$('body')).textContent()).toContain('page: Homepage')

    const aboutLink = await page.$('a[href="/about-us"]')
    expect(aboutLink).toBeDefined()

    await navigate(page, '/about-us')

    const aboutFrLink = await page.$('a[href="/fr/a-propos"]')
    expect(aboutFrLink).toBeDefined()

    await navigate(page, '/fr/a-propos')

    expect(await (await page.$('body')).textContent()).toContain('page: À propos')
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
        storeLocale: 'fr',
        newLocale: 'fr',
        oldLocale: 'en'
      }
    ])
    expect(await (await page.$('body')).textContent()).toContain('locale: fr')
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
        storeLocale: 'fr',
        newLocale: 'fr',
        oldLocale: 'en'
      }
    ])
    expect(await (await page.$('body')).textContent()).toContain('locale: fr')
  })

  test('APIs in app context work after SPA navigation', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))
    await navigate(page, '/middleware')

    expect(await (await page.$('#paths')).textContent()).toBe('/middleware,/fr/middleware-fr')
    expect(await (await page.$('#name')).textContent()).toBe('middleware')
  })
})

describe(`${browserString} (generate)`, () => {
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  let page
  let server

  beforeAll(async () => {
    const distDir = resolve(__dirname, 'fixture', 'basic', '.nuxt-generate')
    await generate(loadConfig(__dirname, 'basic', { generate: { dir: distDir } }))
    server = await startHttpServer(distDir, null, true)
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

  // Issue https://github.com/nuxt-community/nuxt-i18n/issues/378
  test('navigate to non-default locale', async () => {
    page = await browser.newPage()
    await page.goto(server.getUrl('/'))
    expect(await (await page.$('body')).textContent()).toContain('locale: en')

    await navigate(page, '/fr')
    expect(await (await page.$('body')).textContent()).toContain('locale: fr')

    await navigate(page, '/')
    expect(await (await page.$('body')).textContent()).toContain('locale: en')
  })
})

describe(`${browserString} (generate with detectBrowserLanguage.fallbackLocale)`, () => {
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
  let page
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

    server = await startHttpServer(distDir, null, true)
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
    expect(await (await page.$('body')).textContent()).toContain('locale: en')

    await navigate(page, '/fr')
    expect(await (await page.$('body')).textContent()).toContain('locale: fr')
  })

  test('redirects to browser locale', async () => {
    page = await browser.newPage({ locale: 'fr' })
    await page.goto(server.getUrl('/'))
    expect(page.url()).toBe(server.getUrl('/fr'))
    expect(await (await page.$('body')).textContent()).toContain('locale: fr')
  })
})

describe(`${browserString} (no fallbackLocale, browser language not supported)`, () => {
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
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
  // Issue https://github.com/nuxt-community/nuxt-i18n/issues/643
  test('updates language after navigating to another locale', async () => {
    page = await browser.newPage()
    await page.goto(url('/'))
    expect(await (await page.$('body')).textContent()).toContain('locale: pl')

    await navigate(page, '/no')
    expect(await (await page.$('body')).textContent()).toContain('locale: no')
  })
})

describe(`${browserString} (SPA)`, () => {
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
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
    expect(await (await page.$('body')).textContent()).toContain('locale: en')
  })

  test('renders 404 page', async () => {
    page = await browser.newPage()
    await page.goto(url('/nopage'))
    expect(await (await page.$('body')).textContent()).toContain('page could not be found')
  })

  test('preserves the URL on 404 page', async () => {
    const path = '/nopage?a#h'
    page = await browser.newPage()
    await page.goto(url(path))
    expect(await (await page.$('body')).textContent()).toContain('page could not be found')
    expect(await getRouteFullPath(page)).toBe(path)
  })
})

describe(`${browserString} (SPA with router in hash mode)`, () => {
  let nuxt
  /** @type {import('playwright-chromium').ChromiumBrowser} */
  let browser
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

  // Issue https://github.com/nuxt-community/nuxt-i18n/issues/490
  test('navigates directly to page with trailing slash', async () => {
    page = await browser.newPage()
    await page.goto(url('/#/fr/'))
    expect(await (await page.$('body')).textContent()).toContain('locale: fr')
  })

  test('navigates directly to page with query', async () => {
    page = await browser.newPage()
    await page.goto(url('/#/fr?a=1'))
    expect(await (await page.$('body')).textContent()).toContain('locale: fr')
  })
})

describe(`${browserString} (alwaysRedirect)`, () => {
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
    expect(await (await page.$('body')).textContent()).toContain('locale: fr')
  })
})

describe(`${browserString} (vuex disabled)`, () => {
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
    expect(await (await page.$('body')).textContent()).toContain('locale: en')

    const page2 = await browser.newPage()
    await page2.goto(url('/fr'))
    expect(await (await page2.$('body')).textContent()).toContain('locale: fr')
  })
})
