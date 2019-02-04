jest.setTimeout(60000)
process.env.PORT = process.env.PORT || 5060
process.env.NODE_ENV = 'production'

const { Nuxt, Builder } = require('nuxt')
const request = require('request-promise-native')

const config = require('./nuxt.config')

const { cleanUpScripts } = require('../../utils')

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
    const html = await get('/')
    const match = html.match(/<head[^>]*>((.|\n)*)<\/head>/)
    expect(match.length).toBeGreaterThanOrEqual(2)
    const head = match[1]
    expect(head).toMatchSnapshot()
  })

  test('/ contains EN text, link to /fr/ & link /about-us', async () => {
    let html = await get('/')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/fr contains FR text, link to / & link to /fr/a-propos', async () => {
    let html = await get('/fr')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/about-us contains EN text, link to /fr/a-propos & link /', async () => {
    let html = await get('/about-us')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/fr/a-propos contains FR text, link to /about-us & link to /fr/', async () => {
    let html = await get('/fr/a-propos')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/fr/notlocalized contains FR text', async () => {
    let html = await get('/fr/notlocalized')
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

  test('/posts contains EN text, link to /fr/posts/ & link to /posts/my-slug', async () => {
    let html = await get('/posts')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/posts/my-slug contains EN text, post\'s slug, link to /fr/posts/my-slug & link to /posts/', async () => {
    let html = await get('/posts/my-slug')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/fr/posts contains FR text, link to /posts/ & link to /fr/posts/my-slug', async () => {
    let html = await get('/fr/posts')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/fr/posts/my-slug contains FR text, post\'s slug, link to /posts/my-slug & link to /fr/posts/', async () => {
    let html = await get('/fr/posts/my-slug')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/dynamicNested/1/2/3 contains link to /fr/imbrication-dynamique/1/2/3', async () => {
    let html = await get('/dynamicNested/1/2/3')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/fr/imbrication-dynamique/1/2/3 contains link to /dynamicNested/1/2/3', async () => {
    let html = await get('/fr/imbrication-dynamique/1/2/3')
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })
})
