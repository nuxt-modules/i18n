import { generateLoaderOptions } from '../src/gen'
import { getNormalizedLocales, resolveLocales, resolveRelativeLocales, resolveVueI18nConfigInfo } from '../src/utils'
import { vi, beforeEach, afterEach, test, expect } from 'vitest'

import type { LocaleInfo, LocaleObject, NuxtI18nOptions, VueI18nConfigPathInfo } from '../src/types'
import type { Nuxt } from '@nuxt/schema'

vi.mock('node:fs')

vi.mock('pathe', async () => {
  const mod = await vi.importActual<typeof import('pathe')>('pathe')
  return {
    ...mod,
    resolve: vi.fn((...args: string[]) => mod.normalize(args.join('/'))),
    relative: vi.fn((...args: string[]) => args[1].replace(args[0] + '/', ''))
  }
})

vi.mock('@nuxt/kit', async () => {
  const mod = await vi.importActual<typeof import('@nuxt/kit')>('@nuxt/kit')
  return {
    ...mod,
    useNuxt: vi.fn(() => ({
      options: {
        rootDir: '/test',
        srcDir: '/test/srcDir'
      }
    }))
  }
})

beforeEach(async () => {
  vi.spyOn(await import('node:fs'), 'readFileSync').mockReturnValue('export default {}')
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
  absolute: '/path/to/i18n.config.ts',
  relative: 'i18n.config.ts',
  rootDir: '/path/to',
  relativeBase: '..'
} as Required<VueI18nConfigPathInfo>

const makeNuxtOptions = (localeInfo: LocaleInfo[]) => {
  return {
    options: {
      rootDir: '/test',
      buildDir: '.nuxt',
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
  const { generateLoaderOptions } = await import('../src/gen')
  const locales = getMockLocales()
  const localeInfo = await resolveLocales('srcDir', locales, '.nuxt')
  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', NUXT_I18N_VUE_I18N_CONFIG.relative, '.nuxt')
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<VueI18nConfigPathInfo> => x != null),
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      options: { ...NUXT_I18N_OPTIONS, lazy: false }
    },
    makeNuxtOptions(localeInfo)
  )

  expect(code).toMatchSnapshot()
})

test('lazy', async () => {
  const locales = getMockLocales()
  const localeInfo = await resolveLocales('srcDir', locales, '.nuxt')
  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', NUXT_I18N_VUE_I18N_CONFIG.relative, '.nuxt')
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<VueI18nConfigPathInfo> => x != null),
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      options: { ...NUXT_I18N_OPTIONS, lazy: true }
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

  const localeInfo = await resolveLocales('srcDir', locales, '.nuxt')
  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', NUXT_I18N_VUE_I18N_CONFIG.relative, '.nuxt')

  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<VueI18nConfigPathInfo> => x != null),
      localeInfo,
      options: { ...NUXT_I18N_OPTIONS, lazy: true },
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
    l.files = resolveRelativeLocales(l, { langDir: 'locales' })
  }

  const localeInfo = await resolveLocales('srcDir', locales, '.nuxt')
  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', NUXT_I18N_VUE_I18N_CONFIG.relative, '.nuxt')

  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<VueI18nConfigPathInfo> => x != null),
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      options: { ...NUXT_I18N_OPTIONS, lazy: true }
    },
    makeNuxtOptions(localeInfo)
  )

  expect(code).toMatchSnapshot()
})

test('files with cache configuration (relative)', async () => {
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
    l.files = resolveRelativeLocales(l, { langDir: 'locales' })
  }
  const localeInfo = await resolveLocales('srcDir', locales, '.nuxt')
  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', NUXT_I18N_VUE_I18N_CONFIG.relative, '.nuxt')

  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<VueI18nConfigPathInfo> => x != null),
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      options: {
        ...NUXT_I18N_OPTIONS,
        lazy: true,
        experimental: {
          generatedLocaleFilePathFormat: 'relative'
        }
      }
    },
    { ...makeNuxtOptions(localeInfo), options: { ...makeNuxtOptions(localeInfo).options, rootDir: '/test' } }
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
  const localeInfo = await resolveLocales('srcDir', locales, '.nuxt')

  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', NUXT_I18N_VUE_I18N_CONFIG.relative, '.nuxt')
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<VueI18nConfigPathInfo> => x != null),
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      options: { ...NUXT_I18N_OPTIONS, lazy: true }
    },
    { ...makeNuxtOptions(localeInfo), options: { ...makeNuxtOptions(localeInfo).options, rootDir: '/test' } }
  )

  expect(code).toMatchSnapshot()
})

test('vueI18n option', async () => {
  const locales = getMockLocales()
  const localeInfo = await resolveLocales('srcDir', locales, '.nuxt')
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
    ].map(x => resolveVueI18nConfigInfo(x.rootDir, x.relative, '.nuxt'))
  )
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: vueI18nConfigs as Required<VueI18nConfigPathInfo>[],
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      options: {
        vueI18n: 'vue-i18n.config.ts',
        lazy: false
      } as Required<NuxtI18nOptions>
    },
    makeNuxtOptions(localeInfo)
  )

  expect(code).toMatchSnapshot()
})

test('toCode: function (arrow)', async () => {
  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', NUXT_I18N_VUE_I18N_CONFIG.relative, '.nuxt')
  const localeInfo = getMockLocales().map(locale => ({
    ...locale,
    testFunc: (prop: string) => {
      return `Hello ${prop}`
    }
  }))
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<VueI18nConfigPathInfo> => x != null),
      localeInfo: [],
      normalizedLocales: [],
      options: {
        ...NUXT_I18N_OPTIONS,
        lazy: false,
        locales: localeInfo
      }
    },
    makeNuxtOptions(localeInfo as LocaleInfo[])
  )

  expect(code).toMatchSnapshot()
})

test('toCode: function (named)', async () => {
  const vueI18nConfig = await resolveVueI18nConfigInfo('/test', NUXT_I18N_VUE_I18N_CONFIG.relative, '.nuxt')
  const localeInfo = getMockLocales().map(locale => ({
    ...locale,
    testFunc(prop: string) {
      return `Hello ${prop}`
    }
  }))
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<VueI18nConfigPathInfo> => x != null),
      localeInfo: [],
      normalizedLocales: [],
      options: {
        ...NUXT_I18N_OPTIONS,
        lazy: false,
        locales: localeInfo
      }
    },
    makeNuxtOptions(localeInfo as LocaleInfo[])
  )

  expect(code).toMatchSnapshot()
})
