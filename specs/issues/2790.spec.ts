import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { getBrowser, setup, useTestContext } from '../utils'

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
}

async function resolvePublicAsset(publicDir: string, pathname: string) {
  if (pathname === '/') {
    return join(publicDir, '200.html')
  }

  const exactFile = join(publicDir, pathname.slice(1))
  try {
    if ((await stat(exactFile)).isFile()) {
      return exactFile
    }
  } catch {}

  const indexFile = join(publicDir, pathname.slice(1), 'index.html')
  try {
    if ((await stat(indexFile)).isFile()) {
      return indexFile
    }
  } catch {}

  return join(publicDir, '200.html')
}

describe('#2790', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/3988`, import.meta.url)),
    browser: true,
    prerender: true,
    server: false,
    nuxtConfig: {
      i18n: {
        strategy: 'prefix'
      }
    }
  })

  test('redirects the prerender fallback root to the detected locale without mismatches', async () => {
    const publicDir = useTestContext().nuxt!.options.nitro.output!.publicDir!
    const server = createServer(async (request, response) => {
      try {
        const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname
        const filePath = await resolvePublicAsset(publicDir, pathname)
        const contents = await readFile(filePath)

        response.statusCode = 200
        response.setHeader('content-type', contentTypes[extname(filePath)] || 'application/octet-stream')
        response.end(contents)
      } catch {
        response.statusCode = 500
        response.end()
      }
    })

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', () => resolve())
    })

    try {
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Failed to resolve test server address.')
      }

      const browser = await getBrowser()
      const page = await browser.newPage({ locale: 'en' })
      const consoleLogs: { type: string, text: string }[] = []
      const pageErrors: Error[] = []

      page.on('console', message => consoleLogs.push({ type: message.type(), text: message.text() }))
      page.on('pageerror', error => pageErrors.push(error))

      await page.goto(`http://127.0.0.1:${address.port}/`)
      await page.waitForURL(/\/en\/?$/)
      await page.waitForFunction(() => !window.useNuxtApp?.().isHydrating)

      expect(await page.locator('#translated-heading').innerText()).toEqual('English heading')
      expect(await page.locator('#translated-heading-v-text').innerText()).toEqual('English heading')
      expect(await page.locator('#translated-heading-v-html').innerText()).toEqual('English heading')
      expect(await page.getAttribute('#translated-placeholder', 'placeholder')).toEqual('English heading')
      expect(await page.locator('#current-locale').innerText()).toEqual('en')
      expect(await page.getAttribute('#localized-home-link', 'href')).toEqual('/en')
      expect(await page.getAttribute('#localized-home-link-locale', 'href')).toEqual('/en')
      expect(pageErrors).toEqual([])
      expect(
        consoleLogs.some(log =>
          log.type === 'warning' && /hydration|mismatch/i.test(log.text)
        )
      ).toBe(false)
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve())
      })
    }
  })
})
