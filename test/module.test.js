jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000
process.env.PORT = process.env.PORT || 5060
process.env.NODE_ENV = 'production'

const { Nuxt, Builder } = require('nuxt')
const request = require('request-promise-native')

const config = require('./fixture/nuxt.config')

const url = path => `http://localhost:${process.env.PORT}${path}`
const get = path => request(url(path))

describe('basic', () => {
  let nuxt

  beforeAll(async () => {
    nuxt = new Nuxt(config)
    await new Builder(nuxt).build()
    await nuxt.listen(process.env.PORT)
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('sets SEO metadata properly', async () => {
    let html = await get('/')
    expect(html).toMatch(/<html[^>]*lang="en-US"/)
    expect(html).toMatch(/<link[^>]*rel="alternate" href="\/"[^>]*hreflang="en-US"/)
    expect(html).toMatch(/<link[^>]*rel="alternate" href="\/fr"[^>]*hreflang="fr-FR"/)
  })

  test('/ contains EN text, link to /fr/ & link /about-us', async () => {
    let html = await get('/')
    expect(html).toContain('Homepage')
    expect(html).toContain('<a href="/fr">Français</a>')
    expect(html).toContain('<a href="/about-us">About us</a>')
  })

  test('/fr/ contains FR text, link to / & link to /fr/a-propos', async () => {
    let html = await get('/fr/')
    expect(html).toContain('Accueil')
    expect(html).toContain('<a href="/">English</a>')
    expect(html).toContain('<a href="/fr/a-propos">À propos</a>')
  })

  test('/about-us contains EN text, link to /fr/a-propos & link /', async () => {
    let html = await get('/about-us')
    expect(html).toContain('Homepage')
    expect(html).toContain('<a href="/fr/a-propos">Français</a>')
    expect(html).toContain('<a href="/">Homepage</a>')
  })

  test('/fr/a-propos contains FR text, link to /about-us & link to /fr/', async () => {
    let html = await get('/fr/a-propos')
    expect(html).toContain('À propos')
    expect(html).toContain('<a href="/about-us">English</a>')
    expect(html).toContain('<a href="/fr">Accueil</a>')
  })

  test('/fr/notlocalized contains FR text', async () => {
    let html = await get('/fr/notlocalized')
    expect(html).toContain('FR only')
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

  test('/posts contains EN text, link to /fr/posts/ & link to /posts/my-slug', async () => {
    let html = await get('/posts')
    expect(html).toContain('Posts')
    expect(html).toContain('<a href="/fr/posts/">Français</a>')
    expect(html).toContain('<a href="/posts/my-slug">my-slug</a>')
  })

  test('/posts/my-slug contains EN text, post\'s slug, link to /fr/posts/my-slug & link to /posts/', async () => {
    let html = await get('/posts/my-slug')
    expect(html).toContain('Posts')
    expect(html).toContain('<h1>my-slug</h1>')
    expect(html).toContain('<a href="/fr/posts/my-slug">Français</a>')
    expect(html).toContain('<a href="/posts/">index</a>')
  })

  test('/fr/posts contains FR text, link to /posts/ & link to /fr/posts/my-slug', async () => {
    let html = await get('/fr/posts')
    expect(html).toContain('Articles')
    expect(html).toContain('<a href="/posts/">English</a>')
    expect(html).toContain('<a href="/fr/posts/my-slug">my-slug</a>')
  })

  test('/fr/posts/my-slug contains FR text, post\'s slug, link to /posts/my-slug & link to /fr/posts/', async () => {
    let html = await get('/fr/posts/my-slug')
    expect(html).toContain('Articles')
    expect(html).toContain('<h1>my-slug</h1>')
    expect(html).toContain('<a href="/posts/my-slug">English</a>')
    expect(html).toContain('<a href="/fr/posts/">index</a>')
  })

  test('/dynamicNested/1/2/3 contains link to /fr/imbrication-dynamique/1/2/3', async () => {
    let html = await get('/dynamicNested/1/2/3')
    expect(html).toContain('<a href="/fr/imbrication-dynamique/1/2/3">Français</a>')
  })

  test('/fr/imbrication-dynamique/1/2/3 contains link to /dynamicNested/1/2/3', async () => {
    let html = await get('/fr/imbrication-dynamique/1/2/3')
    expect(html).toContain('<a href="/dynamicNested/1/2/3">English</a>')
  })
})
