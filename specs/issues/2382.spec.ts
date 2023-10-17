import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'
import { setup, url, createPage } from '../utils'
import { getText } from '../helper'

describe('#2382', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2382`, import.meta.url))
  })

  test('should handle navigation with dynamic routes without special character', async () => {
    const home = url('/')
    const page = await createPage(undefined, { locale: 'en' })
    await page.goto(home)
    await page.locator('#level-1-no-special-character').click()
    await page.waitForURL('**/level-1')

    expect(await getText(page, '#title')).toEqual(`sub page level-1`)
  })

  test('should handle navigation with dynamic routes with special character', async () => {
    const home = url('/')
    const page = await createPage(undefined, { locale: 'en' })
    await page.goto(home)
    await page.locator('#level-2-with-special-character').click()
    await page.waitForURL(`**/level-1/${encodeURI('lövöl-2')}`)

    expect(await getText(page, '#title')).toEqual(`sub page level-2 with route param id`)
  })

  test('should handle navigation from dynamic route with special character', async () => {
    const home = url('/level-1/somepath-with-ö')
    const page = await createPage(undefined, { locale: 'en' })
    await page.goto(home)
    await page.waitForURL(`**/${encodeURI('level-1/somepath-with-ö')}**`)
    expect(await getText(page, '#title')).toEqual(`sub page level-2 with route param id`)

    await page.locator('#home').click()
    await page.waitForURL(/\/$/)
    expect(await getText(page, '#title')).toEqual(`main page with link to sub page with route param`)
  })

  test('should handle navigation from dynamic route and query parameters with special character', async () => {
    const home = url('/level-1/somepath-with-ö?foo=bär')
    const page = await createPage(undefined, { locale: 'en' })
    await page.goto(home)
    await page.waitForURL(`**/${encodeURI('level-1/somepath-with-ö')}**`)
    expect(await getText(page, '#title')).toEqual(`sub page level-2 with route param id`)

    await page.locator('#home').click()
    await page.waitForURL(/\/$/)
    expect(await getText(page, '#title')).toEqual(`main page with link to sub page with route param`)
  })
})
