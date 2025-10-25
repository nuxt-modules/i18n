import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { fetch, setup, url } from '../utils'

describe('#3842 - prefix strategy catch-all redirects on server route', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/3842`, import.meta.url)),
  })

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
