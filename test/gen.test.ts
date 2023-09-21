import { DEFAULT_OPTIONS } from '../src/constants'
import { generateLoaderOptions } from '../src/gen'
import { resolveLocales, resolveVueI18nConfigInfo } from '../src/utils'

import type { NuxtI18nOptions, NuxtI18nInternalOptions, VueI18nConfigPathInfo } from '../src/types'

vi.mock('node:fs')

vi.mock('pathe', async () => {
  const mod = await vi.importActual<typeof import('pathe')>('pathe')
  return { ...mod, resolve: vi.fn((...args: string[]) => mod.normalize(args.join('/'))) }
})

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
    files: [{ path: 'en.json', cache: true }],
    paths: ['/path/to/en.json']
  },
  {
    code: 'ja',
    files: [{ path: 'ja.json', cache: true }],
    paths: ['/path/to/ja.json']
  },
  {
    code: 'fr',
    files: [{ path: 'fr.json', cache: true }],
    paths: ['/path/to/fr.json']
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
} as Required<VueI18nConfigPathInfo>

test('basic', async () => {
  const { generateLoaderOptions } = await import('../src/gen')
  const localeInfo = await resolveLocales('/test/srcDir', LOCALE_INFO, '..')
  const vueI18nConfig = await resolveVueI18nConfigInfo({ vueI18n: NUXT_I18N_VUE_I18N_CONFIG.relative }, '.nuxt', '.')
  const code = generateLoaderOptions(
    false,
    [vueI18nConfig],
    {
      localeCodes: LOCALE_CODES,
      localeInfo,
      nuxtI18nOptions: NUXT_I18N_OPTIONS,
      nuxtI18nOptionsDefault: DEFAULT_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, dev: true, parallelPlugin: false }
  )

  expect(code).toMatchSnapshot()
})

test('lazy', async () => {
  const localeInfo = await resolveLocales('/test/srcDir', LOCALE_INFO, '..')
  const vueI18nConfig = await resolveVueI18nConfigInfo({ vueI18n: NUXT_I18N_VUE_I18N_CONFIG.relative }, '.nuxt', '.')
  const code = generateLoaderOptions(
    true,
    [vueI18nConfig],
    {
      localeCodes: LOCALE_CODES,
      localeInfo,
      nuxtI18nOptions: NUXT_I18N_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, dev: true, parallelPlugin: false }
  )

  expect(code).toMatchSnapshot()
})

test('multiple files', async () => {
  const localeInfo = await resolveLocales(
    '/test/srcDir',
    [
      ...LOCALE_INFO,
      ...[
        {
          code: 'es',
          files: [{ path: 'es.json', cache: true }],
          paths: ['/path/to/es.json']
        },
        {
          code: 'es-AR',
          files: [
            { path: 'es.json', cache: true },
            { path: 'es-AR.json', cache: true }
          ],
          paths: ['/path/to/es.json', '/path/to/es-AR.json']
        }
      ]
    ],
    '..'
  )
  const vueI18nConfig = await resolveVueI18nConfigInfo({ vueI18n: NUXT_I18N_VUE_I18N_CONFIG.relative }, '.nuxt', '.')

  const code = generateLoaderOptions(
    true,
    [vueI18nConfig],
    {
      localeCodes: [...LOCALE_CODES, 'es', 'es-AR'],
      localeInfo,
      nuxtI18nOptions: NUXT_I18N_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, dev: true, parallelPlugin: false }
  )

  expect(code).toMatchSnapshot()
})

test('files with cache configuration', async () => {
  const localeInfo = await resolveLocales(
    '/test/srcDir',
    [
      ...LOCALE_INFO,
      ...[
        {
          code: 'es',
          files: [{ path: 'es.json', cache: false }],
          paths: ['/path/to/es.json']
        },
        {
          code: 'es-AR',
          files: [
            { path: 'es.json', cache: false },
            { path: 'es-AR.json', cache: true }
          ],
          paths: ['/path/to/es.json', '/path/to/es-AR.json']
        }
      ]
    ],
    '..'
  )
  const vueI18nConfig = await resolveVueI18nConfigInfo({ vueI18n: NUXT_I18N_VUE_I18N_CONFIG.relative }, '.nuxt', '.')

  const code = generateLoaderOptions(
    true,
    [vueI18nConfig],
    {
      localeCodes: [...LOCALE_CODES, 'es', 'es-AR'],
      localeInfo,
      nuxtI18nOptions: NUXT_I18N_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, dev: true, parallelPlugin: false }
  )

  expect(code).toMatchSnapshot()
})

test('locale file in nested', async () => {
  const localeInfo = await resolveLocales(
    '/test/srcDir',
    [
      {
        code: 'en',
        files: [{ path: 'en/main.json', cache: true }],
        paths: ['/path/to/en.json']
      },
      {
        code: 'ja',
        files: [{ path: 'ja/main.json', cache: true }],
        paths: ['/path/to/ja.json']
      },
      {
        code: 'fr',
        files: [{ path: 'fr/main.json', cache: true }],
        paths: ['/path/to/fr.json']
      }
    ],
    '..'
  )

  const vueI18nConfig = await resolveVueI18nConfigInfo({ vueI18n: NUXT_I18N_VUE_I18N_CONFIG.relative }, '.nuxt', '.')
  const code = generateLoaderOptions(
    true,
    [vueI18nConfig],
    {
      localeCodes: LOCALE_CODES,
      localeInfo,
      nuxtI18nOptions: NUXT_I18N_OPTIONS,
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, dev: true, parallelPlugin: false }
  )

  expect(code).toMatchSnapshot()
})

test('vueI18n option', async () => {
  const localeInfo = await resolveLocales('/test/srcDir', LOCALE_INFO, '..')
  const vueI18nConfigs = await Promise.all(
    [
      NUXT_I18N_VUE_I18N_CONFIG,
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
    ].map(x => resolveVueI18nConfigInfo({ vueI18n: x.relative }, '/path/.nuxt', x.rootDir))
  )
  const code = generateLoaderOptions(
    false,
    vueI18nConfigs as Required<VueI18nConfigPathInfo>[],
    {
      localeCodes: LOCALE_CODES,
      localeInfo,
      nuxtI18nOptions: {
        vueI18n: 'vue-i18n.config.ts'
      },
      nuxtI18nInternalOptions: NUXT_I18N_INTERNAL_OPTIONS
    },
    { ssg: false, dev: true, parallelPlugin: false }
  )

  expect(code).toMatchSnapshot()
})

test('toCode: function (arrow)', async () => {
  const vueI18nConfig = await resolveVueI18nConfigInfo({ vueI18n: NUXT_I18N_VUE_I18N_CONFIG.relative }, '.nuxt', '.')
  const code = generateLoaderOptions(
    false,
    [vueI18nConfig],
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

  expect(code).toMatchSnapshot()
})

test('toCode: function (named)', async () => {
  const vueI18nConfig = await resolveVueI18nConfigInfo({ vueI18n: NUXT_I18N_VUE_I18N_CONFIG.relative }, '.nuxt', '.')
  const code = generateLoaderOptions(false, [vueI18nConfig], {
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

  expect(code).toMatchSnapshot()
})
