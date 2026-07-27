import { once } from 'node:events'
import { spawn, type ChildProcess } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { getRandomPort, waitForPort } from 'get-port-please'
import { request } from 'undici'
import { x } from 'tinyexec'
import { chromium } from 'playwright-core'
import { describe, expect, test } from 'vitest'

const fixtures = [
  ['Nuxt 4 and Nitro 2', fileURLToPath(new URL('../fixtures/runtime-nuxt4', import.meta.url)), '4.5.1', '2.13.4'],
  [
    'Nuxt 5 and Nitro 3',
    fileURLToPath(new URL('../fixtures/runtime-nuxt5', import.meta.url)),
    '5.0.0-29745766.482f3357',
    '3.0.260610-beta'
  ]
] as const

async function stopServer(server: ChildProcess) {
  if (server.exitCode !== null) return
  server.kill()
  await once(server, 'exit')
}

async function buildFixture(fixture: string, env: NodeJS.ProcessEnv = process.env) {
  await x('pnpm', ['run', 'build'], {
    throwOnError: true,
    nodeOptions: {
      cwd: fixture,
      env,
      stdio: 'inherit'
    }
  })
}

async function startFixture(fixture: string) {
  const host = '127.0.0.1'
  const port = await getRandomPort(host)
  const server = spawn(process.execPath, [resolve(fixture, '.output/server/index.mjs')], {
    cwd: fixture,
    env: {
      ...process.env,
      HOST: host,
      NODE_ENV: 'production',
      PORT: String(port)
    },
    stdio: ['ignore', 'inherit', 'inherit']
  })
  await waitForPort(port, { host, retries: 200, delay: 100 })

  return { server, url: `http://${host}:${port}` }
}

describe.each(fixtures)('%s', (_name, fixture, nuxtVersion, nitroVersion) => {
  test('builds and redirects the first locale request', async () => {
    await buildFixture(fixture)

    const buildInfo = JSON.parse(await readFile(resolve(fixture, '.output/nitro.json'), 'utf8'))
    expect(buildInfo.framework.version).toBe(nuxtVersion)
    expect(buildInfo.versions.nitro).toBe(nitroVersion)

    const { server, url } = await startFixture(fixture)

    try {
      const redirect = await request(`${url}/`, {
        headers: { 'accept-language': 'fr' },
        maxRedirections: 0
      })
      const setCookie = redirect.headers['set-cookie']
      const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie

      expect(redirect.statusCode).toBe(302)
      expect(redirect.headers.location).toBe('/fr')
      expect(cookie).toContain('i18n_redirected=fr')
      await redirect.body.dump()

      const localized = await request(`${url}/fr`, {
        headers: { cookie: cookie! },
        maxRedirections: 0
      })
      const html = await localized.body.text()

      expect(localized.statusCode).toBe(200)
      expect(html).toContain('Bonjour')
      expect(html).toContain('data-nuxt-i18n')
      expect(html).toContain('Unused English message')
    } finally {
      await stopServer(server)
    }
  })
})

test(
  'Nuxt 5 loads lazy messages on the client without preload',
  async () => {
    const fixture = fixtures[1][1]
    await buildFixture(fixture, { ...process.env, I18N_PRELOAD: 'false' })
    const { server, url } = await startFixture(fixture)
    const browser = await chromium.launch()

    try {
      const page = await browser.newPage({ locale: 'en' })
      await page.goto(url, { waitUntil: 'networkidle' })
      await expect.poll(() => page.locator('#message').textContent()).toContain('Hello')

      await page.locator('#switch-fr').click()
      await expect.poll(() => page.locator('#message').textContent()).toContain('Bonjour')
    } finally {
      await browser.close()
      await stopServer(server)
    }
  },
  120_000,
)
