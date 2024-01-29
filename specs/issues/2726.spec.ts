import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '../utils'
import { getDom } from '../helper'

describe('#2726 - Composable requires access to the Nuxt instance', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2726`, import.meta.url))
  })

  test('Composables correctly initialize common options, no internal server error', async () => {
    const html = await $fetch('/')
    const dom = getDom(html)

    expect(dom.querySelector('head #locale-path').content).toEqual('/nested/test-route')
    expect(dom.querySelector('head #locale-route').content).toEqual('/nested/test-route')
    expect(dom.querySelector('head #switch-locale-path').content).toEqual('/fr')
    expect(dom.querySelector('head #route-base-name').content).toEqual('nested-test-route')
  })
})
