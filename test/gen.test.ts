import { it, expect } from 'vitest'
import { parse } from '@babel/parser'
import { generateLoaderOptions } from '../src/gen'
import { DEFAULT_OPTIONS } from '../src/constants'

import type { NuxtI18nOptions, NuxtI18nInternalOptions } from '../src/types'

const LOCALE_CODES = ['en', 'ja', 'fr']
const LOCALE_INFO = [
  {
    code: 'en',
    path: './locales/en.json'
  },
  {
    code: 'ja',
    path: './locales/ja.json'
  }
]
const NUXT_I18N_OPTIONS = {
  defaultLocale: 'en',
  vueI18n: {
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en: { hello: 'Hello!' }
    }
  }
} as NuxtI18nOptions

const NUXT_I18N_INTERNAL_OPTIONS = {
  __normalizedLocales: [
    {
      code: 'en'
    }
  ]
} as NuxtI18nInternalOptions

function validateSyntax(code: string): boolean {
  let ret = false
  try {
    const node = parse(code, {
      allowImportExportEverywhere: true,
      sourceType: 'module'
    })
    ret = !node.errors.length
  } catch (e) {
    console.error(e)
  }
  return ret
}

it('basic', () => {
  const code = generateLoaderOptions(false, '/path/to/locales', {
    localeCodes: LOCALE_CODES,
    localeInfo: LOCALE_INFO,
    nuxtI18nOptions: NUXT_I18N_OPTIONS,
    nuxtI18nOptionsDefault: DEFAULT_OPTIONS,
    nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
  })
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

it('lazy', () => {
  const code = generateLoaderOptions(true, '/path/to/locales', {
    localeCodes: LOCALE_CODES,
    localeInfo: LOCALE_INFO,
    nuxtI18nOptions: NUXT_I18N_OPTIONS,
    nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
  })
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

it('vueI18n: path', () => {
  const code = generateLoaderOptions(false, '/path/to/locales', {
    localeCodes: LOCALE_CODES,
    localeInfo: LOCALE_INFO,
    nuxtI18nOptions: {
      vueI18n: '~/plugins/vue-i18n.js'
    },
    nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
  })
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})
