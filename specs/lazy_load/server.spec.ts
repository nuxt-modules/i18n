import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch, fetch } from '@nuxt/test-utils'
import { validateSyntax } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/lazy`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      experimental: {
        jsTsFormatResource: true
      },
      defaultLocale: 'en',
      langDir: 'lang',
      lazy: true,
      locales: [
        {
          code: 'en',
          iso: 'en-US',
          file: 'en.json',
          name: 'English'
        },
        {
          code: 'en-GB',
          iso: 'en-GB',
          files: ['en.json', 'en-GB.js', 'en-GB.ts'],
          name: 'English (UK)'
        },
        {
          code: 'fr',
          iso: 'fr-FR',
          file: 'fr.json5',
          name: 'Français'
        }
      ]
    }
  }
})

test('success', async () => {
  const code = await $fetch('/api/__i18n__', {
    method: 'POST',
    body: {
      locale: 'en',
      resource: {
        hello: 'Hello'
      }
    }
  })
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

describe('fail', () => {
  test('no locale param', async () => {
    const res = await fetch('/api/__i18n__', {
      method: 'POST',
      body: JSON.stringify({
        resource: {
          hello: 'Hello'
        }
      })
    })
    expect(res.status).toBe(400)
    expect(res.statusText).toBe(`require the 'locale'`)
  })

  test('no resource param', async () => {
    const res = await fetch('/api/__i18n__', {
      method: 'POST',
      body: JSON.stringify({
        locale: 'en'
      })
    })
    expect(res.status).toBe(400)
    expect(res.statusText).toBe(`require the 'resource'`)
  })

  test('include html code in resource', async () => {
    const res = await fetch('/api/__i18n__', {
      method: 'POST',
      body: JSON.stringify({
        locale: 'en-tag',
        resource: {
          hello: '<script>window.alert("seciruty issue")</script>'
        }
      })
    })
    expect(res.status).toBe(400)
    expect(res.statusText).toBe(`Detected HTML in '<script>window.alert("seciruty issue")</script>' message.`)
  })
})
