import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, undiciRequest } from '../utils'
import { getDom } from '../helper'

// the documented `differentDomains` shape: a scalar `domain` per locale and no `domainDefault`
await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/different_domains`, import.meta.url)),
})

const hosts = [
  ['en', 'en.nuxt-app.localhost'],
  ['no', 'no.nuxt-app.localhost'],
  ['fr', 'fr.nuxt-app.localhost'],
] as const

describe('a domain serving one locale is its default without `domainDefault`', () => {
  test.each(hosts)('%s host serves its locale unprefixed at the root', async (locale, host) => {
    const res = await undiciRequest('/', { headers: { Host: host } })

    // asserting the status matters as much as the content: the regression this covers answered
    // every root with a 302 to `/{locale}` while still rendering the right locale after the hop
    expect(res.statusCode).toBe(200)
    const dom = await getDom(await res.body.text())
    expect(await dom.locator('#lang-switcher-current-locale code').textContent()).toEqual(locale)
  })

  test.each(hosts)('%s host serves an unprefixed path', async (locale, host) => {
    const res = await undiciRequest('/about', { headers: { Host: host } })

    expect(res.statusCode).toBe(200)
    const dom = await getDom(await res.body.text())
    expect(await dom.locator('#lang-switcher-current-locale code').textContent()).toEqual(locale)
  })

  test.each(hosts)('%s host does not serve its own locale prefixed', async (locale, host) => {
    const res = await undiciRequest(`/${locale}/about`, { headers: { Host: host } })

    expect(res.statusCode).toBe(404)
  })

  test('links and canonical use the unprefixed URL on the domain serving the locale', async () => {
    const res = await undiciRequest('/', { headers: { Host: 'fr.nuxt-app.localhost' } })
    const body = await res.body.text()
    const dom = await getDom(body)

    expect(await dom.locator('#switch-locale-path-usages .switch-to-fr a').getAttribute('href')).toEqual('/')
    expect(body).toContain('rel="canonical" href="http://fr.nuxt-app.localhost"')
  })
})
