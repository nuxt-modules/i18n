import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { createPage, setup, url } from '../utils'
import { getText } from '../helper'

// this is an SSG test
await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/issues/3407`, import.meta.url)),
  browser: true,
  prerender: true,
  port: [7777, 7776]
})

test('does not reset cookie no refresh', async () => {
  const page = await createPage('/')
  const heading = await getText(page, '#translated-heading')
  expect(heading).toEqual(`Problema de i18n SSG`)

  await page.goto(url('/', 7776))
  const heading2 = await getText(page, '#translated-heading')
  expect(heading2).toEqual(`i18n SSG issue`)
})
