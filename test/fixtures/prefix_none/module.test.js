jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000
process.env.PORT = process.env.PORT || 5060
process.env.NODE_ENV = 'production'

const { Nuxt, Builder } = require('nuxt')
const request = require('request-promise-native')

const config = require('./nuxt.config')

const { cleanUpScripts } = require('../../utils')

const url = path => `http://localhost:${process.env.PORT}${path}`
const get = params => request(Object.assign(params, { uri: url(params.uri) }))

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
    const html = await get({ uri: '/', headers: { 'Accept-Language': 'en-US' } })
    const match = html.match(/<head>((.|\n)*)<\/head>/)
    expect(match.length).toBeGreaterThanOrEqual(2)
    const head = match[1]
    expect(head).toMatchSnapshot()
  })

  test('/ contains EN text, link to / & link /about-us', async () => {
    let html = await get({ uri: '/', headers: { 'Accept-Language': 'en-US' } })
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/ contains FR text, link to / & link to /a-propos', async () => {
    let html = await get({ uri: '/', headers: { 'Accept-Language': 'fr-FR' } })
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/about-us contains EN text, link to /a-propos & link /', async () => {
    let html = await get({ uri: '/about-us', headers: { 'Accept-Language': 'en-US' } })
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/a-propos contains FR text, link to /about-us & link to /', async () => {
    let html = await get({ uri: '/a-propos', headers: { 'Accept-Language': 'fr-FR' } })
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/fr/notlocalized contains FR text', async () => {
    let html = await get({ uri: '/fr/notlocalized', headers: { 'Accept-Language': 'en-US' } })
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/notlocalized & /fr/fr/notlocalized return 404', async () => {
    let response
    try {
      response = await get({ uri: '/notlocalized' })
    } catch (error) {
      response = error
    }
    expect(response.statusCode).toBe(404)
    try {
      response = await get({ uri: '/fr/fr/notlocalized' })
    } catch (error) {
      response = error
    }
    expect(response.statusCode).toBe(404)
  })

  test('/posts contains EN text, link to /posts/ & link to /posts/my-slug', async () => {
    let html = await get({ uri: '/posts', headers: { 'Accept-Language': 'en-US' } })
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/posts/my-slug contains EN text, post\'s slug, link to /posts/my-slug & link to /posts/', async () => {
    let html = await get({ uri: '/posts/my-slug', headers: { 'Accept-Language': 'en-US' } })
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/posts contains FR text, link to /posts/ & link to /posts/my-slug', async () => {
    let html = await get({ uri: '/posts', headers: { 'Accept-Language': 'fr-FR' } })
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/posts/my-slug contains FR text, post\'s slug, link to /posts/my-slug & link to /posts/', async () => {
    let html = await get({ uri: '/posts/my-slug', headers: { 'Accept-Language': 'fr-FR' } })
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/dynamicNested/1/2/3 contains link to /imbrication-dynamique/1/2/3', async () => {
    let html = await get({ uri: '/dynamicNested/1/2/3', headers: { 'Accept-Language': 'en-US' } })
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })

  test('/imbrication-dynamique/1/2/3 contains link to /dynamicNested/1/2/3', async () => {
    let html = await get({ uri: '/imbrication-dynamique/1/2/3', headers: { 'Accept-Language': 'en-US' } })
    expect(cleanUpScripts(html)).toMatchSnapshot()
  })
})
