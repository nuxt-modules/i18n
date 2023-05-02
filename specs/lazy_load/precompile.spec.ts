import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch, fetch } from '../utils'
import { validateSyntax } from '../helper'
import { NUXT_I18N_PRECOMPILE_ENDPOINT } from '../../src/constants'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/precompile`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {}
  }
})

describe('success', async () => {
  test('locale', async () => {
    const code = await $fetch(NUXT_I18N_PRECOMPILE_ENDPOINT, {
      method: 'POST',
      body: {
        type: 'locale',
        locale: 'en',
        hash: '1234',
        resource: {
          hello: 'Hello'
        }
      }
    })
    expect(validateSyntax(code)).toBe(true)
    expect(code).toMatchSnapshot()
  })

  test('config', async () => {
    const code = await $fetch(NUXT_I18N_PRECOMPILE_ENDPOINT, {
      method: 'POST',
      body: {
        type: 'config',
        hash: '1234',
        resource: {
          ja: {
            hello: 'こんにちは'
          }
        }
      }
    })
    expect(validateSyntax(code)).toBe(true)
    expect(code).toMatchSnapshot()
  })
})

describe('fail', () => {
  test('no type param', async () => {
    const res = await fetch(NUXT_I18N_PRECOMPILE_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        hash: '1234',
        resource: {
          hello: 'Hello'
        }
      })
    })
    expect(res.status).toBe(400)
    expect(res.statusText).toBe(`require the 'type'`)
  })

  test('no configId param', async () => {
    const res = await fetch(NUXT_I18N_PRECOMPILE_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        type: 'config',
        resource: {
          hello: 'Hello'
        }
      })
    })
    expect(res.status).toBe(400)
    expect(res.statusText).toBe(`require the 'hash'`)
  })

  test('no locale param', async () => {
    const res = await fetch(NUXT_I18N_PRECOMPILE_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        type: 'locale',
        hash: '1234',
        resource: {
          hello: 'Hello'
        }
      })
    })
    expect(res.status).toBe(400)
    expect(res.statusText).toBe(`require the 'locale'`)
  })

  test('no resource param', async () => {
    const res = await fetch(NUXT_I18N_PRECOMPILE_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        type: 'locale',
        hash: '1234',
        locale: 'en'
      })
    })
    expect(res.status).toBe(400)
    expect(res.statusText).toBe(`require the 'resource'`)
  })

  test('include html code in resource', async () => {
    const res = await fetch(NUXT_I18N_PRECOMPILE_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        type: 'locale',
        hash: '1234',
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
