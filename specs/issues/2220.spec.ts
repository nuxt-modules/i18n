import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, createPage, url } from '../utils'

describe('#2220', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2220`, import.meta.url)),
  })

  test('message-compiler work on server-side', async () => {
    const page = await createPage(url('/'))
    const appElement = page.locator('#app')

    expect(await appElement.innerText()).include('PROD [ "Test" ]')
    expect(await appElement.innerText()).include(`yeah! it's finally working in prod too`)
  })
})
