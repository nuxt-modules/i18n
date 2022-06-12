import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, $fetch } from '@nuxt/test-utils-edge'

describe('nuxt3', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`./fixtures/nuxt3/basic`, import.meta.url)),
    browser: true
  })

  it('rendered the home', async () => {
    const homeUrl = url('/')
    console.log('home', homeUrl)
    console.log('$fetch', await $fetch('/'))
  })
})
