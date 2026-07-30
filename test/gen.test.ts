import { generateLoaderOptions, simplifyLocaleOptions } from '../src/gen'
import { getNormalizedLocales } from './pages/utils'
import { resolveLocales, resolveRelativeLocales, resolveVueI18nConfigInfo } from '../src/utils'
import { vi, beforeEach, afterEach, test, expect } from 'vitest'
import { parse } from 'pathe'

import type { FileMeta, LocaleObject, NuxtI18nOptions } from '../src/types'

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


test('basic', async () => {
  const locales = getMockLocales()
  const localeInfo = await resolveLocales('/test', locales, {})
  const vueI18nConfig = resolveVueI18nConfigInfo(parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir, {})
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<FileMeta> => x != null),
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      runtimeDir: '/runtime',
      options: { ...NUXT_I18N_OPTIONS }
    }
  )

  expect(code).toMatchSnapshot()
})

test('lazy', async () => {
  const locales = getMockLocales()
  const localeInfo = await resolveLocales('/test', locales, {})
  const vueI18nConfig = resolveVueI18nConfigInfo(parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir, {})
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<FileMeta> => x != null),
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      runtimeDir: '/runtime',
      options: { ...NUXT_I18N_OPTIONS }
    }
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

  const localeInfo = await resolveLocales('/test', locales, {})
  const vueI18nConfig = await resolveVueI18nConfigInfo(parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir, {})

  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<FileMeta> => x != null),
      localeInfo,
      runtimeDir: '/runtime',
      options: { ...NUXT_I18N_OPTIONS },
      normalizedLocales: getNormalizedLocales(locales)
    }
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

  const localeInfo = await resolveLocales('/test', locales, {})
  const vueI18nConfig = resolveVueI18nConfigInfo(parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir, {})

  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<FileMeta> => x != null),
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      runtimeDir: '/runtime',
      options: { ...NUXT_I18N_OPTIONS }
    }
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
  const localeInfo = await resolveLocales('/test', locales, {})

  const vueI18nConfig = await resolveVueI18nConfigInfo(parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir, {})
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [vueI18nConfig].filter((x): x is Required<FileMeta> => x != null),
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      runtimeDir: '/runtime',
      options: { ...NUXT_I18N_OPTIONS }
    }
  )

  expect(code).toMatchSnapshot()
})

test('vueI18n option', async () => {
  const locales = getMockLocales()
  const localeInfo = await resolveLocales('/test', locales, {})
  const vueI18nConfigs = 
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
    ].map(x => resolveVueI18nConfigInfo(parse(NUXT_I18N_VUE_I18N_CONFIG.path).dir, {})
  )
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: vueI18nConfigs as Required<FileMeta>[],
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      runtimeDir: '/runtime',
      options: {
        vueI18n: 'vue-i18n.config.ts'
      } as Required<NuxtI18nOptions>
    }
  )

  expect(code).toMatchSnapshot()
})
test('server asset loaders', async () => {
  const locales = getMockLocales()
  const localeInfo = await resolveLocales('/test', locales, {})
  for (const meta of localeInfo.flatMap(x => x.meta)) {
    meta.assetKey = `${meta.hash}.json`
  }
  const code = generateLoaderOptions(
    {
      vueI18nConfigPaths: [],
      localeInfo,
      normalizedLocales: getNormalizedLocales(locales),
      runtimeDir: '/runtime',
      options: { ...NUXT_I18N_OPTIONS }
    }
  )

  expect(code).toMatchSnapshot()
})

test('simplifyLocaleOptions keeps locale codes and resolves objects through the domain passes', () => {
  const run = (locales: unknown) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    simplifyLocaleOptions({ options: { locales } } as any, {} as any)

  // `mergeConfigLocales` objectifies every locale before this runs, so a string only reaches it
  // through a direct call - it must still not be spread into a character-indexed object
  expect(run(['en', 'fr'])).toEqual(['en', 'fr'])
  expect(run([])).toEqual([])
  expect(run(['en', { code: 'fr', domain: 'fr.example.com' }])).toEqual([
    { code: 'en', language: 'en', domains: [], defaultForDomains: [] },
    { code: 'fr', domain: 'fr.example.com', domains: ['fr.example.com'], defaultForDomains: ['fr.example.com'] },
  ])
})
