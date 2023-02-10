import { test, expect } from 'vitest'
import { parse } from '@babel/parser'
import { generateLoaderOptions } from '../src/gen'
import { DEFAULT_OPTIONS } from '../src/constants'

import type { NuxtI18nOptions, NuxtI18nInternalOptions } from '../src/types'
import type { AdditionalMessages } from '../src/messages'

const LOCALE_CODES = ['en', 'ja', 'fr']
const LOCALE_INFO = [
  {
    code: 'en',
    file: 'en.json',
    path: '/path/to/en.json'
  },
  {
    code: 'ja',
    file: 'ja.json',
    path: '/path/to/ja.json'
  },
  {
    code: 'fr',
    file: 'fr.json',
    path: '/path/to/fr.json'
  }
]
const ADDITIONAL_MESSAGES = {
  en: [
    { foo: 'foo', hello: 'hello1' },
    { bar: 'bar', hello: 'hello2' }
  ],
  ja: [
    { buz: 'buz', hello: 'hello3' },
    { baz: 'baz', hello: 'hello4' }
  ]
} as AdditionalMessages
const NUXT_I18N_OPTIONS = {
  defaultLocale: 'en',
  vueI18n: {
    locale: 'en',
    fallbackLocale: 'fr',
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
      sourceType: 'module',
      plugins: ['importAssertions']
    })
    ret = !node.errors.length
  } catch (e) {
    console.error(e)
  }
  return ret
}

test('basic', () => {
  const code = generateLoaderOptions(
    false,
    'locales',
    '..',
    {
      localeCodes: LOCALE_CODES,
      localeInfo: LOCALE_INFO,
      additionalMessages: {},
      nuxtI18nOptions: NUXT_I18N_OPTIONS,
      nuxtI18nOptionsDefault: DEFAULT_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, ssr: true, dev: true }
  )
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

test('lazy', () => {
  const code = generateLoaderOptions(
    true,
    'locales',
    '..',
    {
      localeCodes: LOCALE_CODES,
      localeInfo: LOCALE_INFO,
      additionalMessages: {},
      nuxtI18nOptions: NUXT_I18N_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, ssr: true, dev: true }
  )
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

test('multiple files', () => {
  const code = generateLoaderOptions(
    true,
    'locales',
    '..',
    {
      localeCodes: [...LOCALE_CODES, 'es', 'es-AR'],
      localeInfo: [
        ...LOCALE_INFO,
        ...[
          {
            code: 'es',
            file: 'es.json',
            path: '/path/to/es.json'
          },
          {
            code: 'es-AR',
            files: ['es.json', 'es-AR.json'],
            paths: ['/path/to/es.json', '/path/to/es-AR.json']
          }
        ]
      ],
      additionalMessages: {},
      nuxtI18nOptions: NUXT_I18N_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, ssr: true, dev: true }
  )
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

test('locale file in nested', () => {
  const code = generateLoaderOptions(
    true,
    'locales',
    '..',
    {
      localeCodes: LOCALE_CODES,
      localeInfo: [
        {
          code: 'en',
          file: 'en/main.json',
          path: '/path/to/en.json'
        },
        {
          code: 'ja',
          file: 'ja/main.json',
          path: '/path/to/ja.json'
        },
        {
          code: 'fr',
          file: 'fr/main.json',
          path: '/path/to/fr.json'
        }
      ],
      additionalMessages: {},
      nuxtI18nOptions: NUXT_I18N_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, ssr: true, dev: true }
  )
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

test('vueI18n: path', () => {
  const code = generateLoaderOptions(
    false,
    'locales',
    '..',
    {
      localeCodes: LOCALE_CODES,
      localeInfo: LOCALE_INFO,
      additionalMessages: ADDITIONAL_MESSAGES,
      nuxtI18nOptions: {
        vueI18n: '~/plugins/vue-i18n.js'
      },
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, ssr: true, dev: true }
  )
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

test('toCode: function (arrow)', () => {
  const code = generateLoaderOptions(
    false,
    'locales',
    '..',
    {
      localeCodes: LOCALE_CODES,
      additionalMessages: {},
      nuxtI18nOptions: {
        ...NUXT_I18N_OPTIONS,
        locales: LOCALE_INFO.map(locale => ({
          ...locale,
          testFunc: (prop: unknown) => {
            return `Hello ${prop}`
          }
        }))
      },
      nuxtI18nOptionsDefault: DEFAULT_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, ssr: true, dev: true }
  )
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

test('toCode: function (named)', () => {
  const code = generateLoaderOptions(false, 'locales', '..', {
    localeCodes: LOCALE_CODES,
    additionalMessages: {},
    nuxtI18nOptions: {
      ...NUXT_I18N_OPTIONS,
      locales: LOCALE_INFO.map(locale => ({
        ...locale,
        testFunc(prop: unknown) {
          return `Hello ${prop}`
        }
      }))
    },
    nuxtI18nOptionsDefault: DEFAULT_OPTIONS,
    nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
  })
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})
