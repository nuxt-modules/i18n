import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { createPage, setup } from '../utils'

describe('#3039', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/3039`, import.meta.url)),
    browser: true
  })

  test('does not detect and set locale client-side if locale has been detected and set server-side', async () => {
    // localized routing is disabled (no_prefix or defineI18nRoute(false))
    const page = await createPage('/')

    // default locale is `fr` but has been set to `en` server-side
    expect(await page.getByTestId('locale').textContent()).toEqual('en')
    expect(await page.getByTestId('welcome').textContent()).toEqual('Welcome')
  })
})
