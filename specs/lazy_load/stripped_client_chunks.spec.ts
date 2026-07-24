import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import { renderPage, waitForLocaleNetwork } from '../helper'
import { setup, useTestContext } from '../utils'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
  browser: true
})

describe('client locale chunks stripped in endpoint mode', () => {
  test('client assets contain no bundled locale messages', async () => {
    // ssr builds always load messages from the endpoint, so client locale chunks are not emitted
    const assetsDir = join(useTestContext().nuxt!.options.nitro.output!.dir!, 'public/_nuxt')
    const chunks = readdirSync(assetsDir).filter(x => x.endsWith('.js'))
    expect(chunks.length).toBeGreaterThan(0)
    for (const chunk of chunks) {
      expect(readFileSync(join(assetsDir, chunk), 'utf8')).not.toContain('Homepage')
    }
  })

  test('client-side locale switch fetches messages from the endpoint', async () => {
    const { page } = await renderPage('/')

    await Promise.all([waitForLocaleNetwork(page, 'fr', 'response'), page.click('#nuxt-locale-link-fr')])
    expect(await page.locator('#home-header').innerText()).toEqual('Accueil')
  })
})
