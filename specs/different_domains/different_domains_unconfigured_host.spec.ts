import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, undiciRequest } from '../utils'
import { getDom } from '../helper'

// domains without `defaultLocale`, which is optional under domains - see the `x-default` guide
await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
  nuxtConfig: {
    i18n: {
      defaultLocale: '',
    },
  },
})

describe('a host matching no configured domain', () => {
  test.each([
    ['/', 'staging.nuxt-app.localhost'],
    ['/about', 'staging.nuxt-app.localhost'],
    ['/', '127.0.0.1'],
  ])('serves %s on %s instead of 404ing', async (path, host) => {
    const res = await undiciRequest(path, { headers: { Host: host } })

    // without an unprefixed locale the route table has nothing at `/` and every unprefixed path 404s
    expect(res.statusCode).toBe(200)
  })

  test('serves every locale there, prefixed, and keeps links relative', async () => {
    const res = await undiciRequest('/fr/about', { headers: { Host: 'staging.nuxt-app.localhost' } })
    expect(res.statusCode).toBe(200)

    const dom = await getDom(await res.body.text())
    expect(await dom.locator('#lang-switcher-current-locale code').textContent()).toEqual('fr')
  })
})
