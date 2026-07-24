import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import { getDom } from '../helper'
import { $fetch, setup } from '../utils'

// `cacheLifetime` enables the message cache, which hands the same message object to every request
await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
  // overrides
  nuxtConfig: {
    i18n: {
      experimental: {
        cacheLifetime: 60
      }
    }
  }
})

describe('cached messages during SSR', () => {
  test('messages merged during a request do not leak into other requests', async () => {
    const first = await getDom(await $fetch('/merge-message?id=a'))
    expect(await first.locator('#merged-keys')!.textContent()).toEqual('merged-a')

    const second = await getDom(await $fetch('/merge-message?id=b'))
    expect(await second.locator('#merged-keys')!.textContent()).toEqual('merged-b')

    const third = await getDom(await $fetch('/merge-message?id=c'))
    expect(await third.locator('#merged-keys')!.textContent()).toEqual('merged-c')
  })

  test('cached messages are still translated correctly', async () => {
    const dom = await getDom(await $fetch('/'))
    expect(await dom.locator('#home-header')!.textContent()).toEqual('Homepage')
  })
})
