// @ts-ignore
import createJITI from 'jiti'
import { JSDOM } from 'jsdom'
import { getBrowser, startServer, url, useTestContext } from './utils'
import { snakeCase } from 'scule'
import { resolveAlias } from '@nuxt/kit'

import { errors, type BrowserContextOptions, type Page } from 'playwright-core'

export async function getText(page: Page, selector: string, options?: Parameters<Page['locator']>[1]) {
  return page.locator(selector, options).innerText()
}

export async function getData(page: Page, selector: string, options?: Parameters<Page['locator']>[1]) {
  return JSON.parse(await page.locator(selector, options).innerText())
}

export async function waitForTransition(page: Page, selector: string = '#nuxt-page.my-leave-active') {
  await page.locator(selector).waitFor()
  return await page.locator(selector).waitFor({ state: 'detached' })
}

export async function assetLocaleHead(page: Page, headSelector: string) {
  const localeHeadValue = await getData(page, headSelector)
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
  const pageErrors: Error[] = []
  const requests: string[] = []
  const consoleLogs: { type: string; text: string }[] = []

  page.on('console', message => {
    consoleLogs.push({
      type: message.type(),
      text: message.text()
    })
  })
  page.on('pageerror', err => {
    pageErrors.push(err)
  })
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
  await waitForURL(page, path)
}

export async function waitForURL(page: Page, path: string) {
  try {
    await page.waitForFunction(
      path => window.useNuxtApp?.()._route.fullPath === path && !window.useNuxtApp?.().isHydrating,
      path
    )
  } catch (err) {
    if (err instanceof errors.TimeoutError) {
      const currentPath = await page.evaluate(() => window.useNuxtApp?.()._route.fullPath)
      const isHydrating = await page.evaluate(() => window.useNuxtApp?.().isHydrating)
      err.message += `\nWaited for URL to be ${path} but got stuck on ${currentPath} with isHydrating: ${isHydrating}`

      const arr = err.stack?.split('\n')
      arr?.splice(1, 1)
      err.stack = arr?.join('\n') ?? undefined
    }

    throw err
  }
}

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

export async function startServerWithRuntimeConfig(env: Record<string, unknown>) {
  const converted = convertObjectToConfig(env)
  await startServer(converted)
  return async () => startServer()
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
