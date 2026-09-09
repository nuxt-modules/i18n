import { describe, expect, test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, undiciRequest } from '../utils'
import { getDom } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/request_config`, import.meta.url)),
})

const request = (path: string, host: string, headers: Record<string, string> = {}) =>
  undiciRequest(path, { headers: { Host: host, ...headers } })

const getPage = async (path: string, host: string) => {
  const res = await request(path, host)
  expect(res.statusCode).toEqual(200)
  return await getDom(await res.body.text())
}

/** The inlined runtime config the client hydrates `$config` from */
const getHydratedConfig = async (host: string) => {
  const html = await (await request('/', host)).body.text()
  const start = html.indexOf('window.__NUXT__.config=')
  expect(start).toBeGreaterThan(-1)
  return html.slice(start, html.indexOf('</script>', start))
}

describe('per-request config via `i18n:request-config`', () => {
  test('an untouched host serves every built locale', async () => {
    const dom = await getPage('/', 'nuxt-app.localhost')

    expect(await dom.locator('#locale').textContent()).toEqual('en')
    expect(await dom.locator('#locale-codes').textContent()).toEqual('en,nl,fr')
    expect(await dom.locator('#locales-list').textContent()).toEqual('en,nl,fr')
    expect(await dom.locator('#path-fr').textContent()).toEqual('/fr')
  })

  test('a narrowed host serves the narrowed locale list', async () => {
    const dom = await getPage('/', 'restricted.nuxt-app.localhost')

    expect(await dom.locator('#locale').textContent()).toEqual('en')
    expect(await dom.locator('#locale-codes').textContent()).toEqual('en,nl')
    expect(await dom.locator('#locales-list').textContent()).toEqual('en,nl')
    // no route to switch to - the unserved locale's routes are pruned for this request
    expect(await dom.locator('#path-fr').textContent()).toEqual('')
  })

  test('a locale the build does not know is dropped', async () => {
    const dom = await getPage('/', 'unknown.nuxt-app.localhost')

    expect(await dom.locator('#locale-codes').textContent()).toEqual('en,nl,fr')
    expect(await dom.locator('#locales-list').textContent()).toEqual('en,nl,fr')
  })

  test('the config the client hydrates from is narrowed too', async () => {
    // `language` tags only appear in the serialized locale list
    expect(await getHydratedConfig('nuxt-app.localhost')).toContain('fr-FR')

    const narrowed = await getHydratedConfig('restricted.nuxt-app.localhost')
    expect(narrowed).toContain('nl-NL')
    expect(narrowed).not.toContain('fr-FR')
  })

  test('an unserved locale prefix 404s instead of serving content', async () => {
    const ok = await request('/fr', 'nuxt-app.localhost')
    expect(ok.statusCode).toEqual(200)

    const notFound = await request('/fr', 'restricted.nuxt-app.localhost')
    expect(notFound.statusCode).toEqual(404)
  })

  test('a served locale prefix still resolves on a narrowed host', async () => {
    const dom = await getPage('/nl', 'restricted.nuxt-app.localhost')

    expect(await dom.locator('#locale').textContent()).toEqual('nl')
    expect(await dom.locator('#hello').textContent()).toEqual('Hallo')
  })

  test('detection does not adopt an unserved locale', async () => {
    // browser language detection redirects to the detected locale on the untouched host
    const detected = await request('/', 'nuxt-app.localhost', { 'accept-language': 'fr' })
    expect(detected.statusCode).toEqual(302)
    expect(detected.headers['location']).toContain('/fr')

    // the same header on the narrowed host stays on the default locale
    const ignored = await request('/', 'restricted.nuxt-app.localhost', { 'accept-language': 'fr' })
    expect(ignored.statusCode).toEqual(200)
  })

  test('a cookie holding an unserved locale is ignored', async () => {
    const detected = await request('/', 'nuxt-app.localhost', { cookie: 'i18n_redirected=fr' })
    expect(detected.statusCode).toEqual(302)
    expect(detected.headers['location']).toContain('/fr')

    const ignored = await request('/', 'restricted.nuxt-app.localhost', { cookie: 'i18n_redirected=fr' })
    expect(ignored.statusCode).toEqual(200)
  })
})
