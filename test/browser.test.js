import getPort from 'get-port'
import { resolve } from 'path'
import { createBrowser } from 'tib'
import { generate, setup, loadConfig, url } from '@nuxtjs/module-test-utils'

const browserString = process.env.BROWSER_STRING || 'puppeteer/core'

const createNavigator = page => {
  return async path => {
    // When returning value resolved by `push`, `chrome/selenium`` crashes with:
    // WebDriverError: unknown error: unhandled inspector error: {"code":-32000,"message":"Object reference chain is too long"}
    // Chain and return nothing to work around.
    await page.runAsyncScript(path => window.$nuxt.$router.push(path).then(() => {}), path)
    await new Promise(resolve => setTimeout(resolve, 50))
  }
}

describe(browserString, () => {
  let nuxt
  let browser
  let page

  beforeAll(async () => {
    nuxt = (await setup(loadConfig(__dirname, 'basic'))).nuxt

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
