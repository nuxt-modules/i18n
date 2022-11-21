import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, url, createPage } from '@nuxt/test-utils'

import type { Response } from 'playwright'

await setup({
  rootDir: fileURLToPath(new URL(`../../fixtures/basic`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      defaultLocale: 'en'
    }
  }
})

test('can not access to disable route path', async () => {
  const home = url('/')
  const page = await createPage()
  await page.goto(home)

  // click `fr` switching link
  await page.locator('#lang-switcher-with-nuxt-link a').click()
  await page.waitForTimeout(100)

  // disalbe href with <NuxtLink>
  expect(await page.locator('#link-ignore-disable').getAttribute('href')).toBe(null)

  // disalbe direct url access
  let res: Response | (Error & { status: () => number }) | null = null
  try {
    res = await page.goto(url('/fr/ignore-routes/disable'))
  } catch (error: unknown) {
    res = error as Error & { status: () => number }
  }
  // 404
  expect(res!.status()).toBe(404) // eslint-disable-line @typescript-eslint/no-non-null-assertion
})
