import { test, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup } from '../utils'
import { gotoPath, renderPage } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/basic_usage`, import.meta.url)),
  browser: true,
  // prerender: true,
  // overrides
  nuxtConfig: {
    runtimeConfig: {
      public: {
        i18n: {
          baseUrl: ''
        }
      }
    },
    i18n: {
      experimental: {
        autoImportTranslationFunctions: true
      }
    }
  }
})

describe('experimental.autoImportTranslationFunctions', async () => {
  test('can use `$t` in `<template>`', async () => {
    const { page, consoleLogs } = await renderPage('/')

    await gotoPath(page, '/')

    const logStrings = consoleLogs.map(x => x.text)
    expect(logStrings).toContain('[autoImportTranslationFunctions][default]: Welcome')
    expect(logStrings).toContain('[autoImportTranslationFunctions][fr]: Bienvenue')
  })
})
