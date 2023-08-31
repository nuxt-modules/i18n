import { JSDOM } from 'jsdom'
import { parse } from '@babel/parser'

import type { Page } from 'playwright'

export async function getText(page: Page, selector: string, options?: Parameters<Page['locator']>[1]) {
  return page.locator(selector, options).innerText()
}

export async function getData(page: Page, selector: string, options?: Parameters<Page['locator']>[1]) {
  return JSON.parse(await page.locator(selector, options).innerText())
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
    const node = parse(code, {
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
