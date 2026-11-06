import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { x } from 'tinyexec'
import { getRandomPort, waitForPort } from 'get-port-please'
import { chromium } from 'playwright-core'

import type { Browser } from 'playwright-core'

const rootDir = fileURLToPath(new URL('../playground-v5', import.meta.url))
const host = '127.0.0.1'

describe('nuxt v5', () => {
  let buildOutput = ''
  let baseURL = ''
  let server: ReturnType<typeof x> | undefined
  let browser: Browser | undefined

  beforeAll(async () => {
    const build = await x('nuxt', ['build'], { nodeOptions: { cwd: rootDir }, throwOnError: true })
    buildOutput = build.stdout + build.stderr

    const port = await getRandomPort(host)
    baseURL = `http://${host}:${port}`
    server = x('node', ['.output/server/index.mjs'], {
      nodeOptions: { cwd: rootDir, env: { ...process.env, HOST: host, PORT: String(port) } },
    })
    await waitForPort(port, { host, retries: 50, delay: 100 })
  })

  afterAll(async () => {
    await browser?.close()
    server?.kill()
  })

  test('does not need the nitro v2 compatibility layer', () => {
    expect(buildOutput).toContain('Nuxt 5.')
    expect(buildOutput).not.toContain('NUXT_B9003')
  })

  test('renders the locale of the route', async () => {
    expect(await fetch(`${baseURL}/`).then(r => r.text())).toContain('Welcome')
    expect(await fetch(`${baseURL}/ja`).then(r => r.text())).toContain('ようこそ')
  })

  test('redirects to the detected locale', async () => {
    const res = await fetch(`${baseURL}/?foo=bar`, { headers: { 'accept-language': 'ja' }, redirect: 'manual' })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/ja?foo=bar')
    expect(res.headers.get('set-cookie')).toContain('i18n_redirected=ja')
    expect(await res.text()).not.toContain('<div id="__nuxt">')
  })

  test('serves locale messages', async () => {
    const res = await fetch(`${baseURL}/_i18n/hash/ja/messages.json`)
    expect(await res.json()).toEqual({ ja: { welcome: 'ようこそ' } })
    expect(await fetch(`${baseURL}/_i18n/hash/fr/messages.json`).then(r => r.json())).toEqual({ fr: { welcome: 'Bienvenue' } })
    expect((await fetch(`${baseURL}/_i18n/hash/de/messages.json`)).status).toBe(404)
  })

  test('translates on the server with the locale detector', async () => {
    const translate = (init?: RequestInit, query = '') =>
      fetch(`${baseURL}/api/translate${query}`, init).then(r => r.json())

    expect(await translate()).toEqual({ welcome: 'Welcome' })
    expect(await translate({}, '?locale=ja')).toEqual({ welcome: 'ようこそ' })
    expect(await translate({ headers: { cookie: 'i18n_locale=ja' } })).toEqual({ welcome: 'ようこそ' })
    expect(await translate({ headers: { 'accept-language': 'ja' } })).toEqual({ welcome: 'ようこそ' })
  })

  test('switches locale on the client', async () => {
    browser = await chromium.launch()
    const page = await browser.newPage()
    await page.goto(`${baseURL}/ja`)
    await expect.poll(() => page.locator('h1').innerText()).toBe('ようこそ')

    await page.waitForFunction(() => window.useNuxtApp?.().isHydrating === false)
    await page.getByText('English').click()
    await expect.poll(() => page.url()).toBe(`${baseURL}/`)
    await expect.poll(() => page.locator('h1').innerText()).toBe('Welcome')
  })
})
