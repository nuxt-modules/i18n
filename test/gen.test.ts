import { generateLoaderOptions } from '../src/gen'
import { getNormalizedLocales } from './pages/utils'
import { resolveLocales, resolveRelativeLocales, resolveVueI18nConfigInfo } from '../src/utils'
import { vi, beforeEach, afterEach, test, expect } from 'vitest'
import { parse } from 'pathe'

import type { FileMeta, LocaleInfo, LocaleObject, NuxtI18nOptions } from '../src/types'
import type { Nuxt } from '@nuxt/schema'

vi.mock('node:fs')

vi.mock('@nuxt/kit', async () => {
  const mod = await vi.importActual<typeof import('@nuxt/kit')>('@nuxt/kit')
  return {
    ...mod,
    useNuxt: vi.fn(() => ({
      options: {
        rootDir: '/test',
        srcDir: '/test/srcDir',
        buildDir: '/test/.nuxt'
      }
    }))
  }
})

beforeEach(async () => {
  vi.spyOn(await import('node:fs'), 'readFileSync').mockReturnValue('export default {}')
  vi.spyOn(await import('node:fs'), 'existsSync').mockReturnValue(true)
})

afterEach(() => {
  vi.clearAllMocks()
})

function getMockLocales(additionalLocales?: LocaleObject[]) {
  return [
    {
      code: 'en',
      files: [{ path: 'en.json', cache: true }]
    },
    {
      code: 'ja',
      files: [{ path: 'ja.json', cache: true }]
    },
    {
      code: 'fr',
      files: [{ path: 'fr.json', cache: true }]
    },
    ...(additionalLocales ? additionalLocales : [])
  ]
}

const NUXT_I18N_OPTIONS = {
  defaultLocale: 'en',
  vueI18n: ''
} as Required<NuxtI18nOptions>

const NUXT_I18N_VUE_I18N_CONFIG = {
  // absolute
  path: '/path/to/i18n.config.ts'
} as Required<FileMeta>

const makeNuxtOptions = (localeInfo: LocaleInfo[]) => {
  return {
    options: {
      rootDir: '/test',
      srcDir: '/test',
      buildDir: '/test/.nuxt',
      _layers: [
        {
          config: {
            i18n: {
              locales: localeInfo
            }
          }
        }
      ]
    }
  } as unknown as Nuxt
}

test('basic', async () => {
  const locales = getMockLocales()
  const localeInfo = await resolveLocales('/test', locales)
  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir)
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<FileMeta> => x != null),
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      options: { ...NUXT_I18N_OPTIONS }
    },
    makeNuxtOptions(localeInfo)
  )

  expect(code).toMatchSnapshot()
})

test('lazy', async () => {
  const locales = getMockLocales()
  const localeInfo = await resolveLocales('/test', locales)
  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir)
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<FileMeta> => x != null),
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      options: { ...NUXT_I18N_OPTIONS }
    },
    makeNuxtOptions(localeInfo)
  )

  expect(code).toMatchSnapshot()
})

test('multiple files', async () => {
  const locales = [
    ...getMockLocales([
      {
        code: 'es',
        files: [{ path: 'es.json', cache: true }]
      },
      {
        code: 'es-AR',
        files: [
          { path: 'es.json', cache: true },
          { path: 'es-AR.json', cache: true }
        ]
      }
    ])
  ]

  const localeInfo = await resolveLocales('/test', locales)
  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir)

  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<FileMeta> => x != null),
      localeInfo,
      options: { ...NUXT_I18N_OPTIONS },
      normalizedLocales: getNormalizedLocales(locales)
    },
    makeNuxtOptions(localeInfo)
  )

  expect(code).toMatchSnapshot()
})

test('files with cache configuration', async () => {
  const locales = getMockLocales([
    {
      code: 'es',
      files: [{ path: 'es.json', cache: false }]
    },
    {
      code: 'es-AR',
      files: [
        { path: 'es.json', cache: false },
        { path: 'es-AR.json', cache: true }
      ]
    }
  ])

  for (const l of locales) {
    // @ts-ignore
    l.files = resolveRelativeLocales(l, { langDir: '/test/srcDir/locales' })
  }

  const localeInfo = await resolveLocales('/test', locales)
  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir)

  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<FileMeta> => x != null),
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      options: { ...NUXT_I18N_OPTIONS }
    },
    makeNuxtOptions(localeInfo)
  )

  expect(code).toMatchSnapshot()
})

test('locale file in nested', async () => {
  const locales = [
    {
      code: 'en',
      files: [{ path: 'en/main.json', cache: true }]
    },
    {
      code: 'ja',
      files: [{ path: 'ja/main.json', cache: true }]
    },
    {
      code: 'fr',
      files: [{ path: 'fr/main.json', cache: true }]
    }
  ]
  const localeInfo = await resolveLocales('/test', locales)

  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir)
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<FileMeta> => x != null),
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      options: { ...NUXT_I18N_OPTIONS }
    },
    { ...makeNuxtOptions(localeInfo), options: { ...makeNuxtOptions(localeInfo).options, rootDir: '/test' } }
  )

  expect(code).toMatchSnapshot()
})

test('vueI18n option', async () => {
  const locales = getMockLocales()
  const localeInfo = await resolveLocales('/test', locales)
  const vueI18nConfigs = await Promise.all(
    [
      NUXT_I18N_VUE_I18N_CONFIG,
      {
        meta: {
          path: '/path/layer1/i18n.custom.ts',
          loadPath: 'i18n.custom.ts'
        }
      },
      {
        meta: {
          path: '/path/foo/layer2/vue-i18n.options.js',
          loadPath: 'vue-i18n.options.js'
        }
      }
    ].map(x => resolveVueI18nConfigInfo('/test', parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir))
  )
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: vueI18nConfigs as Required<FileMeta>[],
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      options: {
        vueI18n: 'vue-i18n.config.ts'
      } as Required<NuxtI18nOptions>
    },
    makeNuxtOptions(localeInfo)
  )

  expect(code).toMatchSnapshot()
})

test('toCode: function (arrow)', async () => {
  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir)
  const localeInfo = getMockLocales().map(locale => ({
    ...locale,
    testFunc: (prop: string) => {
      return `Hello ${prop}`
    }
  }))
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<FileMeta> => x != null),
      localeInfo: [],
      normalizedLocales: [],
      options: {
        ...NUXT_I18N_OPTIONS,
        locales: localeInfo
      }
    },
    makeNuxtOptions(localeInfo as unknown as LocaleInfo[])
  )

  expect(code).toMatchSnapshot()
})

test('toCode: function (named)', async () => {
  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir)
  const localeInfo = getMockLocales().map(locale => ({
    ...locale,
    testFunc(prop: string) {
      return `Hello ${prop}`
    }
  }))
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<FileMeta> => x != null),
      localeInfo: [],
      normalizedLocales: [],
      options: {
        ...NUXT_I18N_OPTIONS,
        locales: localeInfo
      }
    },
    makeNuxtOptions(localeInfo as unknown as LocaleInfo[])
  )

  expect(code).toMatchSnapshot()
})
