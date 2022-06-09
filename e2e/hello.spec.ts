import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, $fetch } from '@nuxt/test-utils-edge'
;[/*'bridge'*/ 'nuxt3', 'bridge'].forEach(pattern => {
  describe(pattern, async () => {
    await setup({
      rootDir: fileURLToPath(new URL(`./fixtures/${pattern}`, import.meta.url)),
      browser: true
    })

    it('rendered the home', async () => {
      const homeUrl = url('/')
      console.log('home', homeUrl)
      console.log('$fetch', await $fetch('/'))
      expect(true).toBe(true)
    })
  })
})
