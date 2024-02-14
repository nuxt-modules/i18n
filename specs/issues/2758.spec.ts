import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, fetch, url } from '../utils'

describe('#2758', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2758`, import.meta.url))
  })

  test('`statusCode` in `rootRedirect` should work with strategy "prefix"', async () => {
    const res = await fetch(url('/'))
    expect(res.status).toEqual(418)
    expect(res.headers.get('location')).toEqual('/en/test-route')
  })
})
