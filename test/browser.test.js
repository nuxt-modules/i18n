import { resolve } from 'path'
import getPort from 'get-port'
import { createBrowser } from 'tib'
import { generate, setup, loadConfig, url } from '@nuxtjs/module-test-utils'

const browserString = process.env.BROWSER_STRING || 'puppeteer/core'

async function createDefaultBrowser () {
  return await createBrowser(browserString, {
    staticServer: false,
    extendPage (page) {
      return {
        navigate: createNavigator(page),
        getRouteFullPath () {
          return page.runScript(() => window.$nuxt.$route.fullPath)
        }
      }
    }
  })
}

function createNavigator (page) {
  return async path => {
    // When returning value resolved by `push`, `chrome/selenium`` crashes with:
    // WebDriverError: unknown error: unhandled inspector error: {"code":-32000,"message":"Object reference chain is too long"}
    // Chain and return nothing to work around.
    await page.runAsyncScript(path => {
      return new Promise((resolve, reject) => {
        window.$nuxt.$router.push(path, () => resolve(), reject)
      })
    }, path)
    await new Promise(resolve => setTimeout(resolve, 50))
  }
}

describe(browserString, () => {
  let nuxt
  let browser
  let page

  beforeAll(async () => {
    const override = {
      plugins: ['~/plugins/i18n-hooks.js']
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override, { merge: true }))).nuxt

    browser = await createBrowser(browserString, {
      staticServer: false,
      extendPage (page) {
        return {
          getTestData () {
            return page.runScript(() => {
              const languageSwitchedListeners = (window.testData && window.testData.languageSwitchedListeners) || []

              return {
                languageSwitchedListeners
              }
            })
          },
          navigate: createNavigator(page)
        }
      }
    })
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }

    await nuxt.close()
  })

  test('navigate with SPA', async () => {
    page = await browser.page(url('/'))

    expect(await page.getText('body')).toContain('page: Homepage')

    const aboutLink = await page.getElement('a[href="/about-us"]')
    expect(aboutLink).toBeDefined()

    await page.navigate('/about-us')

    const aboutFrLink = await page.getElement('a[href="/fr/a-propos"]')
    expect(aboutFrLink).toBeDefined()

    await page.navigate('/fr/a-propos')

    expect(await page.getText('body')).toContain('page: À propos')
  })

  test('changes route and locale with setLocale', async () => {
    page = await browser.page(url('/'))

    let testData = await page.getTestData()
    expect(testData.languageSwitchedListeners).toEqual([])

    await page.clickElement('#set-locale-link-fr')

    testData = await page.getTestData()
    expect(testData.languageSwitchedListeners).toEqual([
      {
        storeLocale: 'fr',
        newLocale: 'fr',
        oldLocale: 'en'
      }
    ])
    expect(await page.getText('body')).toContain('locale: fr')
  })

  test('onLanguageSwitched listener triggers after locale was changed', async () => {
    page = await browser.page(url('/'))

    let testData = await page.getTestData()
    expect(testData.languageSwitchedListeners).toEqual([])

    await page.navigate('/fr/')

    testData = await page.getTestData()
    expect(testData.languageSwitchedListeners).toEqual([
      {
        storeLocale: 'fr',
        newLocale: 'fr',
        oldLocale: 'en'
      }
    ])
    expect(await page.getText('body')).toContain('locale: fr')
  })

  test('APIs in app context work after SPA navigation', async () => {
    page = await browser.page(url('/'))
    await page.navigate('/middleware')

    expect(await page.getText('#paths')).toBe('/middleware,/fr/middleware-fr')
    expect(await page.getText('#name')).toBe('middleware')
  })
})

describe(`${browserString} (generate)`, () => {
  let browser
  let page
  let port
  // Local method that overrides imported one.
  let url

  beforeAll(async () => {
    const distDir = resolve(__dirname, 'fixture', 'basic', '.nuxt-generate')

    await generate(loadConfig(__dirname, 'basic', { generate: { dir: distDir } }))

    port = await getPort()
    url = path => `http://localhost:${port}${path}`

    browser = await createBrowser(browserString, {
      folder: distDir,
      staticServer: {
        folder: distDir,
        port
      },
      extendPage (page) {
        return {
          navigate: createNavigator(page)
        }
      }
    })
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
  })

  // Issue https://github.com/nuxt-community/nuxt-i18n/issues/378
  test('navigate to non-default locale', async () => {
    page = await browser.page(url('/'))
    expect(await page.getText('body')).toContain('locale: en')

    await page.navigate('/fr')
    expect(await page.getText('body')).toContain('locale: fr')

    await page.navigate('/')
    expect(await page.getText('body')).toContain('locale: en')
  })
})

describe(`${browserString} (generate with detectBrowserLanguage.fallbackLocale)`, () => {
  let browser
  let page
  let port
  // Local method that overrides imported one.
  let url

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

    port = await getPort()
    url = path => `http://localhost:${port}${path}`

    browser = await createBrowser(browserString, {
      folder: distDir,
      staticServer: {
        folder: distDir,
        port
      },
      extendPage (page) {
        return {
          navigate: createNavigator(page)
        }
      }
    })
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
  })

  test('generates pages in all locales', async () => {
    page = await browser.page(url('/'))
    expect(await page.getText('body')).toContain('locale: en')

    await page.navigate('/fr')
    expect(await page.getText('body')).toContain('locale: fr')
  })
})

describe(`${browserString} (no fallbackLocale, browser language not supported)`, () => {
  let nuxt
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

    browser = await createDefaultBrowser()
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
    page = await browser.page(url('/'))
    expect(await page.getText('body')).toContain('locale: pl')

    await page.navigate('/no')
    expect(await page.getText('body')).toContain('locale: no')
  })
})

describe(`${browserString} (SPA)`, () => {
  let nuxt
  let browser
  let page

  beforeAll(async () => {
    const overrides = {
      mode: 'spa'
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    browser = await createDefaultBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }

    await nuxt.close()
  })

  test('renders existing page', async () => {
    page = await browser.page(url('/'))
    expect(await page.getText('body')).toContain('locale: en')
  })

  test('renders 404 page', async () => {
    page = await browser.page(url('/nopage'))
    expect(await page.getText('body')).toContain('page could not be found')
  })

  test('preserves the URL on 404 page', async () => {
    const path = '/nopage?a#h'
    page = await browser.page(url(path))
    expect(await page.getText('body')).toContain('page could not be found')
    expect(await page.getRouteFullPath()).toBe(path)
  })
})

describe(`${browserString} (SPA with router in hash mode)`, () => {
  let nuxt
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
    browser = await createDefaultBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }

    await nuxt.close()
  })

  // Issue https://github.com/nuxt-community/nuxt-i18n/issues/490
  test('navigates directly to page with trailing slash', async () => {
    page = await browser.page(url('/#/fr/'))
    expect(await page.getText('body')).toContain('locale: fr')
  })

  test('navigates directly to page with query', async () => {
    page = await browser.page(url('/#/fr?a=1'))
    expect(await page.getText('body')).toContain('locale: fr')
  })
})

describe(`${browserString} (alwaysRedirect)`, () => {
  let nuxt
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
    browser = await createDefaultBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    await nuxt.close()
  })

  // This seems like a wrong behavior with `alwaysRedirect` enabled...
  test('does not redirect to default locale on navigation', async () => {
    const page = await browser.page(url('/'))
    await page.navigate('/fr')
    expect(await page.getText('body')).toContain('locale: fr')
  })
})

describe(`${browserString} (vuex disabled)`, () => {
  let nuxt
  let browser

  beforeAll(async () => {
    const overrides = {
      i18n: {
        vuex: false
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    browser = await createDefaultBrowser()
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    await nuxt.close()
  })

  test('navigates to route with correct locale', async () => {
    let page = await browser.page(url('/'))
    expect(await page.getText('body')).toContain('locale: en')
    page = await browser.page(url('/fr'))
    expect(await page.getText('body')).toContain('locale: fr')
  })
})
