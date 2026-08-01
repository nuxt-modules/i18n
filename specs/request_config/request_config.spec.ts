import { describe, expect, test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, undiciRequest } from '../utils'
import { getDom } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/request_config`, import.meta.url)),
})

const request = (path: string, host: string, headers: Record<string, string> = {}) =>
  undiciRequest(path, { headers: { Host: host, ...headers } })

describe('per-request config via `i18n:request-config`', () => {
  test('an untouched host serves every built locale', async () => {
    const res = await request('/', 'nuxt-app.localhost')
    expect(res.statusCode).toEqual(200)
    const dom = await getDom(await res.body.text())

    expect(await dom.locator('#locale').textContent()).toEqual('en')
    expect(await dom.locator('#locale-codes').textContent()).toEqual('en,nl,fr')
    expect(await dom.locator('#locales-list').textContent()).toEqual('en,nl,fr')
    expect(await dom.locator('#path-fr').textContent()).toEqual('/fr')
  })

  test('a narrowed host serves the narrowed locale list', async () => {
    const res = await request('/', 'restricted.nuxt-app.localhost')
    expect(res.statusCode).toEqual(200)
    const dom = await getDom(await res.body.text())

    expect(await dom.locator('#locale').textContent()).toEqual('en')
    expect(await dom.locator('#locale-codes').textContent()).toEqual('en,nl')
    expect(await dom.locator('#locales-list').textContent()).toEqual('en,nl')
    // no route to switch to - the disabled locale's routes are pruned for this request
    expect(await dom.locator('#path-fr').textContent()).toEqual('')
  })

  test('the payload carries the narrowed config to the client', async () => {
    const res = await request('/', 'restricted.nuxt-app.localhost')
    const html = await res.body.text()
    // the serialized runtime config the client hydrates from must agree with the server
    expect(html).not.toContain('fr-FR')
  })

  test('a disabled locale prefix 404s instead of serving content', async () => {
    const ok = await request('/fr', 'nuxt-app.localhost')
    expect(ok.statusCode).toEqual(200)

    const notFound = await request('/fr', 'restricted.nuxt-app.localhost')
    expect(notFound.statusCode).toEqual(404)
  })

  test('an enabled locale prefix still serves on a narrowed host', async () => {
    const res = await request('/nl', 'restricted.nuxt-app.localhost')
    expect(res.statusCode).toEqual(200)
    const dom = await getDom(await res.body.text())
    expect(await dom.locator('#locale').textContent()).toEqual('nl')
    expect(await dom.locator('#hello').textContent()).toEqual('Hallo')
  })

  test('detection does not adopt a disabled locale', async () => {
    // browser language detection redirects to the detected locale on the untouched host
    const detected = await request('/', 'nuxt-app.localhost', { 'accept-language': 'fr' })
    expect(detected.statusCode).toEqual(302)
    expect(detected.headers['location']).toContain('/fr')

    // the same header on the narrowed host stays on the default locale
    const ignored = await request('/', 'restricted.nuxt-app.localhost', { 'accept-language': 'fr' })
    expect(ignored.statusCode).toEqual(200)
  })

  test('a cookie holding a disabled locale is ignored', async () => {
    const detected = await request('/', 'nuxt-app.localhost', { cookie: 'i18n_redirected=fr' })
    expect(detected.statusCode).toEqual(302)
    expect(detected.headers['location']).toContain('/fr')

    const ignored = await request('/', 'restricted.nuxt-app.localhost', { cookie: 'i18n_redirected=fr' })
    expect(ignored.statusCode).toEqual(200)
  })
})
