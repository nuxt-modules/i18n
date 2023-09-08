import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '../utils'
import { getDom } from '../helper'

describe('#2374', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2374`, import.meta.url))
  })

  describe('detection issues 2374 with host on server', () => {
    test.each([
      ['en.nuxt-app.localhost', 'test issue 2374'],
      ['zh.nuxt-app.localhost', '测试问题2374']
    ])('%s host', async (host, header) => {
      const html = await $fetch('/', {
        headers: {
          Host: host
        }
      })
      const dom = getDom(html)
      expect(dom.querySelector('#content').textContent).toEqual(header)
    })
  })

  test('detection issues 2374  with x-forwarded-host on server', async () => {
    const html = await $fetch('/', {
      headers: {
        'X-Forwarded-Host': 'zh.nuxt-app.localhost'
      }
    })
    const dom = getDom(html)

    expect(dom.querySelector('#content').textContent).toEqual('测试问题2374')
  })
})
