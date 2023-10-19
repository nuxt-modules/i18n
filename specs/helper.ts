/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-ignore
import { JSDOM } from 'jsdom'
import { parse as babelParse } from '@babel/parser'
import { expect } from 'vitest'
import { getBrowser, url, useTestContext } from './utils'

import { errors, type BrowserContextOptions, type Page } from 'playwright'

export async function getText(page: Page, selector: string, options?: Parameters<Page['locator']>[1]) {
  return page.locator(selector, options).innerText()
}

export async function getData(page: Page, selector: string, options?: Parameters<Page['locator']>[1]) {
  return JSON.parse(await page.locator(selector, options).innerText())
}

export async function waitForTransition(page: Page, selector: string = '#nuxt-page.my-leave-active') {
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

export function validateSyntax(code: string): boolean {
  let ret = false
  try {
    const node = babelParse(code, {
      allowImportExportEverywhere: true,
      sourceType: 'module'
    })
    ret = !node.errors.length
  } catch (e) {
    console.error(e)
  }
  return ret
}

export async function waitForMs(ms = 1000) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

export const isRenderingJson = true

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
    await page.goto(url(path), { waitUntil: 'networkidle' })
    await page.waitForFunction(() => window.useNuxtApp?.())
  }

  return {
    page,
    pageErrors,
    requests,
    consoleLogs
  }
}

export async function expectNoClientErrors(path: string) {
  const ctx = useTestContext()
  if (!ctx.options.browser) {
    return
  }

  const { page, pageErrors, consoleLogs } = (await renderPage(path))!

  const consoleLogErrors = consoleLogs.filter(i => i.type === 'error')
  const consoleLogWarnings = consoleLogs.filter(i => i.type === 'warning')

  expect(pageErrors).toEqual([])
  expect(consoleLogErrors).toEqual([])
  expect(consoleLogWarnings).toEqual([])

  await page.close()
}

export async function gotoPath(page: Page, path: string) {
  await page.goto(url(path))
  await waitForURL(page, path)
}

export async function waitForURL(page: Page, path: string) {
  try {
    await page.waitForFunction(path => window.useNuxtApp?.()._route.fullPath === path, path)
  } catch (err) {
    if (err instanceof errors.TimeoutError) {
      const currentPath = await page.evaluate(() => window.useNuxtApp?.()._route.fullPath)
      err.message += `\nWaited for URL to be ${path} but got stuck on ${currentPath}`

      const arr = err.stack?.split('\n')
      arr?.splice(1, 1)
      err.stack = arr?.join('\n') ?? undefined
    }

    throw err
  }
}
