import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from '../utils'
import { renderPage } from '../helper'

describe('#2617', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`../fixtures/issues/2617`, import.meta.url)),
    browser: true
  })

  test('should use inline locale objects', async () => {
    const { consoleLogs } = await renderPage('/')

    expect(
      consoleLogs.some(
        log =>
          log.type === 'warning' &&
          log.text.includes('[nuxt-i18n-routing] Locale ISO code is required to generate alternate link')
      )
    ).toBe(false)
  })
})
