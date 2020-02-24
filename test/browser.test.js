import { resolve } from 'path'
import getPort from 'get-port'
import { createBrowser } from 'tib'
import { generate, setup, loadConfig, url } from '@nuxtjs/module-test-utils'

const browserString = process.env.BROWSER_STRING || 'puppeteer/core'

const createNavigator = page => {
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

    browser = await createBrowser(browserString, {
      staticServer: false,
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
