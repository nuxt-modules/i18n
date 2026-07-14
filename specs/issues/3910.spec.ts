import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { fetch, setup, url } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/issues/3910`, import.meta.url))
})

describe('#3910 - i18n disable for route needs priority to catch-all route on SSR', () => {
  const URL_PATHNAME = '/test'

  test('should not redirect i18n disable routes', async () => {
    const res = await fetch(url(URL_PATHNAME))

    const u = new URL(res.url)
    expect(res.status).toBe(200)
    expect(u.pathname).toBe(URL_PATHNAME)
    expect(await res.text()).toContain('Test page not localized')
  })
})

describe('#3842 - prefix strategy catch-all redirects on server route', () => {
  test('should not redirect API calls', async () => {
    const res = await fetch(url('/api/test'))

    expect(res.redirected).toBe(false)
    expect(await res.json()).toMatchInlineSnapshot(`
      {
        "message": "Hello from test endpoint!",
      }
    `)
  })
})
