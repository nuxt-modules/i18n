import { setup, loadConfig, get, url } from '@nuxtjs/module-test-utils'
import { JSDOM } from 'jsdom'

import { cleanUpScripts } from './utils'

const getDom = html => (new JSDOM(html)).window.document

describe('basic', () => {
  let nuxt

  beforeAll(async () => {
    nuxt = (await setup(loadConfig(__dirname, 'basic'))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('sets SEO metadata properly', async () => {
    const html = await get('/')
    const match = html.match(/<head[^>]*>((.|\n)*)<\/head>/)
    expect(match.length).toBeGreaterThanOrEqual(2)
    const head = match[1]
    expect(head).toMatchSnapshot()
  })

  test('/ contains EN text, link to /fr/ & link /about-us', async () => {
    const html = await get('/')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/fr contains FR text, link to / & link to /fr/a-propos', async () => {
    const html = await get('/fr')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/about-us contains EN text, link to /fr/a-propos & link /', async () => {
    const html = await get('/about-us')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/fr/a-propos contains FR text, link to /about-us & link to /fr/', async () => {
    const html = await get('/fr/a-propos')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/fr/notlocalized contains FR text', async () => {
    const html = await get('/fr/notlocalized')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/notlocalized & /fr/fr/notlocalized return 404', async () => {
    let response
    try {
      response = await get('/notlocalized')
    } catch (error) {
      response = error
    }
    expect(response.statusCode).toBe(404)
    try {
      response = await get('/fr/fr/notlocalized')
    } catch (error) {
      response = error
    }
    expect(response.statusCode).toBe(404)
  })

  describe('posts', () => {
    let html
    let title
    let langSwitcherLink
    let link
    const getElements = () => {
      const dom = getDom(html)
      title = dom.querySelector('h1')
      const links = [...dom.querySelectorAll('a')]
      langSwitcherLink = links[0]
      link = links[1]
    }

    test('/posts contains EN text, link to /fr/articles/ & link to /posts/my-post', async () => {
      html = await get('/posts')
      getElements()
      expect(title.textContent).toBe('Posts')
      expect(langSwitcherLink.href).toBe('/fr/articles/')
      expect(link.href).toBe('/posts/my-post')
    })

    test('/posts/my-post contains EN text, link to /fr/articles/mon-article & link to /posts/', async () => {
      html = await get('/posts/my-post')
      getElements()
      expect(title.textContent).toBe('Posts')
      expect(langSwitcherLink.href).toBe('/fr/articles/mon-article')
      expect(link.href).toBe('/posts/')
    })

    test('/fr/articles contains FR text, link to /posts/ & link to /fr/articles/mon-article', async () => {
      html = await get('/fr/articles')
      getElements()
      expect(title.textContent).toBe('Articles')
      expect(langSwitcherLink.href).toBe('/posts/')
      expect(link.href).toBe('/fr/articles/mon-article')
    })

    test('/fr/articles/mon-article contains FR text, link to /posts/my-post & link to /fr/articles/', async () => {
      html = await get('/fr/articles/mon-article')
      getElements()
      expect(title.textContent).toBe('Articles')
      expect(langSwitcherLink.href).toBe('/posts/my-post')
      expect(link.href).toBe('/fr/articles/')
    })
  })

  test('/dynamicNested/1/2/3 contains link to /fr/imbrication-dynamique/1/2/3', async () => {
    const html = await get('/dynamicNested/1/2/3')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/fr/imbrication-dynamique/1/2/3 contains link to /dynamicNested/1/2/3', async () => {
    const html = await get('/fr/imbrication-dynamique/1/2/3')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('localePath returns correct path', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    const newRoute = window.$nuxt.localePath('about')
    expect(newRoute).toBe('/about-us')
  })
})

describe('lazy loading', () => {
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        lazy: true,
        langDir: 'lang/',
        vueI18n: {
          fallbackLocale: 'en'
        }
      }
    }

    const testConfig = loadConfig(__dirname, 'basic', override, { merge: true })

    // Override those after merging to overwrite original values.
    testConfig.i18n.locales = [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
        file: 'en-US.js'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français',
        file: 'fr-FR.js'
      }
    ]
    testConfig.i18n.vueI18n.messages = null

    nuxt = (await setup(testConfig)).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('shows fallback string', async () => {
    const html = await get('/fr/fallback')
    const dom = getDom(html)
    const title = dom.querySelector('h1')
    expect(title.textContent).toBe('in english')
  })
})

describe('no_prefix strategy', () => {
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        strategy: 'no_prefix'
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'no-lang-switcher', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('sets SEO metadata properly', async () => {
    const html = await get('/')
    const dom = getDom(html)
    const metas = dom.querySelectorAll('head meta')
    expect(metas.length).toBe(2)
    expect(metas[0].getAttribute('property')).toBe('og:locale')
    expect(metas[0].getAttribute('content')).toBe('en_US')
    expect(metas[1].getAttribute('property')).toBe('og:locale:alternate')
    expect(metas[1].getAttribute('content')).toBe('fr_FR')
  })

  test('/ contains EN text & link /about', async () => {
    const html = await get('/')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/about contains EN text & link /', async () => {
    const html = await get('/about')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/fr/ returns 404', async () => {
    let response
    try {
      response = await get('/fr/')
    } catch (error) {
      response = error
    }
    expect(response.statusCode).toBe(404)
  })

  test('localePath returns correct path', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    const newRoute = window.$nuxt.localePath('about')
    expect(newRoute).toBe('/about')
  })

  test('localePath with non-current locale triggers warning', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    const spy = jest.spyOn(window.console, 'warn').mockImplementation(() => {})

    const newRoute = window.$nuxt.localePath('about', 'fr')
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('unsupported when using no_prefix')
    expect(newRoute).toBe('/about')

    spy.mockRestore()
  })
})

describe('no_prefix strategy + differentDomains', () => {
  let nuxt
  let spy

  beforeAll(async () => {
    spy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterAll(async () => {
    spy.mockRestore()
    await nuxt.close()
  })

  test('triggers warning', async () => {
    const override = {
      i18n: {
        strategy: 'no_prefix',
        differentDomains: true
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'no-lang-switcher', override, { merge: true }))).nuxt

    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('The `differentDomains` option and `no_prefix` strategy are not compatible')
  })
})

describe('invalid strategy', () => {
  let nuxt
  let spy

  beforeAll(async () => {
    spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(async () => {
    spy.mockRestore()
    await nuxt.close()
  })

  test('triggers error on building', async () => {
    const override = {
      i18n: {
        strategy: 'nopenope'
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'no-lang-switcher', override, { merge: true }))).nuxt

    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('Invalid "strategy" option "nopenope"')
  })
})

describe('hash mode', () => {
  let nuxt

  beforeAll(async () => {
    const override = {
      router: {
        mode: 'hash'
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('localePath returns correct path (without hash)', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    const newRoute = window.$nuxt.localePath('about')
    expect(newRoute).toBe('/about-us')
  })
})

describe('with router base', () => {
  let nuxt

  beforeAll(async () => {
    const override = {
      router: {
        base: '/app/'
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('localePath returns correct path', async () => {
    const window = await nuxt.renderAndGetWindow(url('/app/'))
    const newRoute = window.$nuxt.localePath('about')
    expect(newRoute).toBe('/about-us')
  })
})

describe('differentDomains enabled', () => {
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        differentDomains: true,
        seo: false
      }
    }

    const localConfig = loadConfig(__dirname, 'basic', override, { merge: true })

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
        domain: 'fr.nuxt-app.localhost'
      }
    ]

    nuxt = (await setup(localConfig)).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('matches domain\'s locale (en)', async () => {
    const requestOptions = {
      headers: {
        Host: 'en.nuxt-app.localhost'
      }
    }
    const html = await get('/', requestOptions)
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('matches domain\'s locale (fr)', async () => {
    const requestOptions = {
      headers: {
        Host: 'fr.nuxt-app.localhost'
      }
    }
    const html = await get('/', requestOptions)
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })
})
