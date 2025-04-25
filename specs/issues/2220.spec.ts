import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, createPage, url } from '../utils'

describe('#2220', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2220`, import.meta.url))
  })

  test('message-compiler work on server-side', async () => {
    const home = url('/')
    const page = await createPage()
    await page.goto(home)

    expect(await page.locator('#app').innerText()).include('PROD [ "Test" ]')
    expect(await page.locator('#app').innerText()).include(`yeah! it's finally working in prod too`)
  })
})
