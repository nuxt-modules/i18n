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

  test('cached messages are shared by reference and frozen', async () => {
    // canary for the mechanism itself: direct mutation throws only when the store holds the
    // frozen shared cache object - a fresh copy (e.g. a silent fallback to `$fetch`) would
    // accept the write and this assertion would catch the regression
    const dom = await getDom(await $fetch('/mutate-message'))
    expect(await dom.locator('#mutation-threw')!.textContent()).toEqual('true')
    expect(await dom.locator('#translated')!.textContent()).toEqual('Homepage')
  })

  test('merge after mutation attempt still isolates requests', async () => {
    const merged = await getDom(await $fetch('/merge-message?id=z'))
    expect(await merged.locator('#merged-keys')!.textContent()).toEqual('merged-z')

    const canary = await getDom(await $fetch('/mutate-message'))
    expect(await canary.locator('#mutation-threw')!.textContent()).toEqual('true')
  })

  test('cached messages are still translated correctly', async () => {
    const dom = await getDom(await $fetch('/'))
    expect(await dom.locator('#home-header')!.textContent()).toEqual('Homepage')
  })
})
