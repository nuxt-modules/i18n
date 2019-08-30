import { createBrowser } from 'tib'
import { setup, loadConfig, url } from '@nuxtjs/module-test-utils'

const browserString = process.env.BROWSER_STRING || 'puppeteer/core'

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
          async navigate (path) {
            // When returning value resolved by `push`, `chrome/selenium`` crashes with:
            // WebDriverError: unknown error: unhandled inspector error: {"code":-32000,"message":"Object reference chain is too long"}
            // Chain and return nothing to work around.
            await page.runAsyncScript(path => window.$nuxt.$router.push(path).then(() => {}), path)
            await new Promise(resolve => setTimeout(resolve, 50))
          }
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
