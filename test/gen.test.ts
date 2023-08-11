import { parse } from '@babel/parser'
import { DEFAULT_OPTIONS } from '../src/constants'
import { generateLoaderOptions } from '../src/gen'

import type { NuxtI18nOptions, NuxtI18nInternalOptions, VueI18nConfigPathInfo } from '../src/types'

vi.mock('node:fs')

beforeEach(async () => {
  vi.spyOn(await import('node:fs'), 'readFileSync').mockReturnValue('export default {}')
})

afterEach(() => {
  vi.clearAllMocks()
})

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
const NUXT_I18N_OPTIONS = {
  defaultLocale: 'en'
} as NuxtI18nOptions

const NUXT_I18N_INTERNAL_OPTIONS = {
  __normalizedLocales: [
    {
      code: 'en'
    }
  ]
} as NuxtI18nInternalOptions

const NUXT_I18N_VUE_I18N_CONFIG = {
  absolute: '/path/to/i18n.config.ts',
  relative: 'i18n.config.ts',
  rootDir: '/path/to',
  relativeBase: '..'
} as VueI18nConfigPathInfo

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

test('basic', async () => {
  const { generateLoaderOptions } = await import('../src/gen')
  const code = generateLoaderOptions(
    false,
    'locales',
    '..',
    NUXT_I18N_VUE_I18N_CONFIG,
    [],
    {
      localeCodes: LOCALE_CODES,
      localeInfo: LOCALE_INFO,
      nuxtI18nOptions: NUXT_I18N_OPTIONS,
      nuxtI18nOptionsDefault: DEFAULT_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, dev: true, parallelPlugin: false }
  )
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

test('lazy', () => {
  const code = generateLoaderOptions(
    true,
    'locales',
    '..',
    NUXT_I18N_VUE_I18N_CONFIG,
    [],
    {
      localeCodes: LOCALE_CODES,
      localeInfo: LOCALE_INFO,
      nuxtI18nOptions: NUXT_I18N_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, dev: true, parallelPlugin: false }
  )
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

test('multiple files', () => {
  const code = generateLoaderOptions(
    true,
    'locales',
    '..',
    NUXT_I18N_VUE_I18N_CONFIG,
    [],
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
      nuxtI18nOptions: NUXT_I18N_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, dev: true, parallelPlugin: false }
  )
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

test('locale file in nested', () => {
  const code = generateLoaderOptions(
    true,
    'locales',
    '..',
    NUXT_I18N_VUE_I18N_CONFIG,
    [],
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
      nuxtI18nOptions: NUXT_I18N_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, dev: true, parallelPlugin: false }
  )
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

test('vueI18n option', () => {
  const code = generateLoaderOptions(
    false,
    'locales',
    '..',
    NUXT_I18N_VUE_I18N_CONFIG,
    [
      {
        absolute: '/path/layer1/i18n.custom.ts',
        relative: 'i18n.custom.ts',
        rootDir: '/path/layer1',
        relativeBase: '../..'
      },
      {
        absolute: '/path/foo/layer2/vue-i18n.options.js',
        relative: 'vue-i18n.options.js',
        rootDir: '/path/foo/layer2',
        relativeBase: '../../..'
      }
    ],
    {
      localeCodes: LOCALE_CODES,
      localeInfo: LOCALE_INFO,
      nuxtI18nOptions: {
        vueI18n: 'vue-i18n.config.ts'
      },
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, dev: true, parallelPlugin: false }
  )
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

test('toCode: function (arrow)', () => {
  const code = generateLoaderOptions(
    false,
    'locales',
    '..',
    NUXT_I18N_VUE_I18N_CONFIG,
    [],
    {
      localeCodes: LOCALE_CODES,
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
    { ssg: false, dev: true, parallelPlugin: false }
  )
  expect(validateSyntax(code)).toBe(true)
  expect(code).toMatchSnapshot()
})

test('toCode: function (named)', () => {
  const code = generateLoaderOptions(false, 'locales', '..', NUXT_I18N_VUE_I18N_CONFIG, [], {
    localeCodes: LOCALE_CODES,
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
