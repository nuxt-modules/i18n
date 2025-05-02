// @ts-ignore
import createJITI from 'jiti'
import { JSDOM } from 'jsdom'
import { getBrowser, startServer, TestContext, url, useTestContext } from './utils'
import { resolveAlias } from '@nuxt/kit'
import { onTestFinished } from 'vitest'

import { errors, Response, type BrowserContextOptions, type Page } from 'playwright-core'

export function waitForLocaleSwitch(page: Page) {
  return page.evaluate(
    async () =>
      await new Promise<{ oldLocale: string; newLocale: string }>(resolve =>
        // @ts-expect-error browser only
        useNuxtApp().hooks.hookOnce('i18n:localeSwitched', resolve)
      )
  )
}

export async function waitForTransition(page: Page, selector: string = '#nuxt-page.my-leave-active') {
  await page.locator(selector).waitFor()
  return await page.locator(selector).waitFor({ state: 'detached' })
}

export async function assetLocaleHead(page: Page, headSelector: string) {
  const localeHeadValue = await JSON.parse(await page.locator(headSelector).innerText())
  const headHandle = await page.locator('head').elementHandle()
  await page.evaluateHandle(
    ([headTag, localeHead]) => {
      const headData = [...localeHead.link, ...localeHead.meta]
      for (const head of headData) {
        const tag = headTag.querySelector(`[id="${head.id}"]`)
        for (const [key, value] of Object.entries(head)) {
          if (key === 'id') {
            continue
          }
          const v = tag.getAttribute(key)
          if (v !== value) {
            throw new Error(`${key} ${v} !== ${value}`)
          }
        }
      }
    },
    [headHandle, localeHeadValue]
  )
  headHandle?.dispose()
}

export function getDom(html: string) {
  return new JSDOM(html).window.document
}

export function getDataFromDom(dom: Document, selector: string) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return JSON.parse(dom.querySelector(selector)!.textContent!.replace('&quot;', '"'))
}

export async function assertLocaleHeadWithDom(dom: Document, headSelector: string) {
  const localeHead = getDataFromDom(dom, headSelector)
  const headData = [...localeHead.link, ...localeHead.meta]
  for (const head of headData) {
    const tag = dom.querySelector(`[id="${head.id}"]`)
    for (const [key, value] of Object.entries(head)) {
      if (key === 'id') {
        continue
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const v = tag!.getAttribute(key)
      if (v !== value) {
        throw new Error(`${key} ${v} !== ${value}`)
      }
    }
  }
}

export async function waitForMs(ms = 1000) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

export async function renderPage(path = '/', options?: BrowserContextOptions) {
  const ctx = useTestContext()
  if (!ctx.options.browser) {
    throw new Error('`renderPage` require `options.browser` to be set')
  }

  const browser = await getBrowser()
  const page = await browser.newPage(options)

  page.setDefaultNavigationTimeout(process.env.CI ? 30 * 1000 : 5 * 1000)

  const _locator = page.locator.bind(page)
  page.locator = (selector, options) => {
    const locator = _locator(selector, options)
    const _click = locator.click.bind(locator)
    locator.clickNavigate = async options => await fnAndWaitForNavigation(page, async () => await _click(options))
    return locator
  }

  const _goBack = page.goBack.bind(page)
  page.goBackNavigate = async options => await fnAndWaitForNavigation(page, async () => await _goBack(options))

  const _click = page.click.bind(page)
  page.clickNavigate = async (selector, options) =>
    await fnAndWaitForNavigation(page, async () => await _click(selector, options))

  const consoleLogs: { type: string; text: string }[] = []
  page.on('console', message => consoleLogs.push({ type: message.type(), text: message.text() }))

  const pageErrors: Error[] = []
  page.on('pageerror', err => pageErrors.push(err))

  const requests: string[] = []
  page.on('request', req => {
    try {
      requests.push(req.url().replace(url('/'), '/'))
    } catch (err) {
      // TODO
    }
  })

  if (path) {
    /**
     * Nuxt uses `gotoPath` here, this would throw errors as the given `path` can differ
     * from the final path due to language detection and redirects.
     */
    // gotoPath(page, path)

    await page.goto(url(path))
    await page.waitForFunction(() => !window.useNuxtApp?.().isHydrating)
  }

  return {
    page,
    pageErrors,
    requests,
    consoleLogs
  }
}

export async function gotoPath(page: Page, path: string) {
  await page.goto(url(path))
  await page.waitForURL(url(path))
}

export async function fnAndWaitForNavigation<T>(page: Page, fn: () => Promise<T>) {
  const waitForNav = page.evaluate(() => {
    return new Promise<void>(resolve => {
      // @ts-expect-error untyped
      const unsub = window.useNuxtApp?.().$router.afterEach(() => {
        unsub()
        resolve()
      })
    })
  })
  const res = await fn()
  await waitForNav
  return res
}

declare module 'playwright-core' {
  interface Page {
    clickNavigate: Page['click']
    goBackNavigate: Page['goBack']
  }

  interface Locator {
    clickNavigate: Locator['click']
  }
}
async function updateProcessRuntimeConfig(ctx: TestContext, config: unknown) {
  const updated = new Promise<unknown>(resolve => {
    const handler = (msg: { type: string; value: unknown }) => {
      if (msg.type === 'confirm:runtime-config') {
        ctx.serverProcess!.process?.off('message', handler)
        resolve(msg.value)
      }
    }
    ctx.serverProcess!.process?.on('message', handler)
  })

  ctx.serverProcess!.process?.send({ type: 'update:runtime-config', value: config }, undefined, {
    keepOpen: true
  })

  return await updated
}

export async function setServerRuntimeConfig(env: Record<string, unknown>, skipRestore = false) {
  const ctx = useTestContext()

  const stored = await updateProcessRuntimeConfig(ctx, env)

  let restored = false
  const restoreFn = async () => {
    if (restored) return

    restored = true
    await await updateProcessRuntimeConfig(ctx, stored)
  }

  if (!skipRestore) {
    onTestFinished(restoreFn)
  }

  return restoreFn
}

import { snakeCase } from 'scule'

function flattenObject(obj: Record<string, unknown> = {}) {
  const flattened: Record<string, unknown> = {}

  for (const key of Object.keys(obj)) {
    const entry = obj[key]

    if (typeof entry !== 'object' || entry == null) {
      flattened[key] = obj[key]
      continue
    }

    const flatObject = flattenObject(entry as Record<string, unknown>)
    for (const x of Object.keys(flatObject)) {
      flattened[key + '_' + x] = flatObject[x]
    }
  }

  return flattened
}

function convertObjectToConfig(obj: Record<string, unknown>) {
  const makeEnvKey = (str: string) => `NUXT_${snakeCase(str).toUpperCase()}`

  const env: Record<string, unknown> = {}
  const flattened = flattenObject(obj)
  for (const key in flattened) {
    env[makeEnvKey(key)] = flattened[key]
  }

  return env
}
export async function startServerWithRuntimeConfig(env: Record<string, unknown>, skipRestore = false) {
  const ctx = useTestContext()
  const stored = await updateProcessRuntimeConfig(ctx, env)

  await startServer(convertObjectToConfig(env))

  let restored = false
  const restoreFn = async () => {
    if (restored) return

    restored = true
    // await await updateProcessRuntimeConfig(ctx, stored)
    await startServer({})
  }

  if (!skipRestore) {
    onTestFinished(restoreFn)
  }

  return restoreFn
}

export async function localeLoaderHelpers() {
  const ctx = useTestContext()
  const jiti = createJITI(ctx.nuxt!.options.rootDir, { alias: ctx.nuxt!.options.alias })
  const opts = await jiti.import(resolveAlias('#build/i18n.options.mjs'), {})

  function findKey(code: string, ext: string, cache: boolean = false): string {
    // @ts-expect-error generated
    return opts.localeLoaders[code].find(x => x.cache === cache && x.key.includes(ext + '_'))!.key
  }

  return { findKey }
}

export function waitForLocaleRequest(page: Page, locale: string) {
  return page.waitForRequest(new RegExp(`/_i18n/${locale}/messages.json`))
}
