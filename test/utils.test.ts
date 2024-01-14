import { parseSegment, getRoutePath, resolveLocales } from '../src/utils'
import type { LocaleObject } from '../src/types'

vi.mock('pathe', async () => {
  const mod = await vi.importActual<typeof import('pathe')>('pathe')
  return { ...mod, resolve: vi.fn((...args: string[]) => mod.normalize(args.join('/'))) }
})

vi.mock('@nuxt/kit', () => {
  const resolveFiles = () => {
    return [
      ['en', 'json'],
      ['ja', 'json'],
      ['es', 'json'],
      ['es-AR', 'json'],
      ['nl', 'js']
    ].map(pair => `/path/to/project/locales/${pair[0]}.${pair[1]}`)
  }
  return { resolveFiles }
})

vi.mock('node:fs')

beforeEach(async () => {
  vi.spyOn(await import('node:fs'), 'readFileSync').mockReturnValue(
    'export default defineI18nLocale(() => { return {} })'
  )
})

afterEach(() => {
  vi.clearAllMocks()
})

test('resolveLocales', async () => {
  const locales = [
    {
      code: 'en',
      files: ['en.json']
    },
    {
      code: 'ja',
      files: ['ja.json']
    },
    {
      code: 'es',
      files: ['es.json']
    },
    {
      code: 'es-AR',
      files: ['es.json', 'es-AR.json']
    },
    {
      code: 'nl',
      files: ['nl.js']
    }
  ] as LocaleObject[]
  const resolvedLocales = await resolveLocales('/path/to/project/locales', locales, '..')
  expect(resolvedLocales).toEqual([
    {
      code: 'en',
      files: [{ path: 'en.json', cache: true }],
      meta: [
        {
          path: '/path/to/project/locales/en.json',
          loadPath: '../en.json',
          type: 'static',
          hash: '18f36abf',
          parsed: {
            root: '/',
            dir: '/path/to/project/locales',
            base: 'en.json',
            ext: '.json',
            name: 'en'
          },
          key: 'locale__path_to_project_locales_en_json',
          file: { path: 'en.json', cache: true }
        }
      ]
    },
    {
      code: 'ja',
      files: [{ path: 'ja.json', cache: true }],
      meta: [
        {
          path: '/path/to/project/locales/ja.json',
          loadPath: '../ja.json',
          type: 'static',
          hash: '147c88eb',
          parsed: {
            root: '/',
            dir: '/path/to/project/locales',
            base: 'ja.json',
            ext: '.json',
            name: 'ja'
          },
          key: 'locale__path_to_project_locales_ja_json',
          file: { path: 'ja.json', cache: true }
        }
      ]
    },
    {
      code: 'es',
      files: [{ path: 'es.json', cache: true }],
      meta: [
        {
          path: '/path/to/project/locales/es.json',
          loadPath: '../es.json',
          type: 'static',
          hash: 'f4490d2c',
          parsed: {
            root: '/',
            dir: '/path/to/project/locales',
            base: 'es.json',
            ext: '.json',
            name: 'es'
          },
          key: 'locale__path_to_project_locales_es_json',
          file: { path: 'es.json', cache: true }
        }
      ]
    },
    {
      code: 'es-AR',
      files: [
        { path: 'es.json', cache: true },
        { path: 'es-AR.json', cache: true }
      ],
      meta: [
        {
          path: '/path/to/project/locales/es.json',
          loadPath: '../es.json',
          type: 'static',
          hash: 'f4490d2c',
          parsed: {
            root: '/',
            dir: '/path/to/project/locales',
            base: 'es.json',
            ext: '.json',
            name: 'es'
          },
          key: 'locale__path_to_project_locales_es_json',
          file: { path: 'es.json', cache: true }
        },
        {
          path: '/path/to/project/locales/es-AR.json',
          loadPath: '../es-AR.json',
          type: 'static',
          hash: '96ad3952',
          parsed: {
            root: '/',
            dir: '/path/to/project/locales',
            base: 'es-AR.json',
            ext: '.json',
            name: 'es-AR'
          },
          key: 'locale__path_to_project_locales_es_AR_json',
          file: { path: 'es-AR.json', cache: true }
        }
      ]
    },
    {
      code: 'nl',
      files: [{ path: 'nl.js', cache: false }],
      meta: [
        {
          path: '/path/to/project/locales/nl.js',
          loadPath: '../nl.js',
          type: 'dynamic',
          hash: '68b1a130',
          parsed: {
            root: '/',
            dir: '/path/to/project/locales',
            base: 'nl.js',
            ext: '.js',
            name: 'nl'
          },
          key: 'locale__path_to_project_locales_nl_js',
          file: { path: 'nl.js', cache: false }
        }
      ]
    }
  ])
})

test('parseSegment', () => {
  const tokens = parseSegment('[foo]_[bar]:[...buz]_buz_[[qux]]')
  expect(tokens).toEqual([
    { type: 1, value: 'foo' },
    { type: 0, value: '_' },
    { type: 1, value: 'bar' },
    { type: 0, value: ':' },
    { type: 3, value: 'buz' },
    { type: 0, value: '_buz_' },
    { type: 2, value: 'qux' }
  ])
})

test('getRoutePath', () => {
  const tokens = parseSegment('[foo]_[bar]:[...buz]_buz_[[qux]]')
  expect(getRoutePath(tokens)).toBe(`/:foo_:bar::buz(.*)*_buz_:qux?`)
})
