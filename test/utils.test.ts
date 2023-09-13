import { parseSegment, getRoutePath, resolveLocales } from '../src/utils'
import type { LocaleObject } from 'vue-i18n-routing'

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
      file: 'en.json'
    },
    {
      code: 'ja',
      file: 'ja.json'
    },
    {
      code: 'es',
      file: 'es.json'
    },
    {
      code: 'es-AR',
      files: ['es.json', 'es-AR.json']
    },
    {
      code: 'nl',
      file: 'nl.js'
    }
  ] as LocaleObject[]
  const resolvedLocales = await resolveLocales('/path/to/project/locales', locales)
  expect(resolvedLocales).toEqual([
    {
      paths: ['/path/to/project/locales/en.json'],
      code: 'en',
      files: [{ cache: true, path: 'en.json' }],
      hashes: ['18f36abf'],
      types: ['static']
    },
    {
      paths: ['/path/to/project/locales/ja.json'],
      code: 'ja',
      files: [{ path: 'ja.json', cache: true }],
      hashes: ['147c88eb'],
      types: ['static']
    },
    {
      paths: ['/path/to/project/locales/es.json'],
      code: 'es',
      files: [{ path: 'es.json', cache: true }],
      hashes: ['f4490d2c'],
      types: ['static']
    },
    {
      paths: ['/path/to/project/locales/es.json', '/path/to/project/locales/es-AR.json'],
      code: 'es-AR',
      files: [
        { path: 'es.json', cache: true },
        { path: 'es-AR.json', cache: true }
      ],
      hashes: ['f4490d2c', '96ad3952'],
      types: ['static', 'static']
    },
    {
      paths: ['/path/to/project/locales/nl.js'],
      code: 'nl',
      files: [{ path: 'nl.js', cache: false }],
      hashes: ['68b1a130'],
      types: ['dynamic']
    }
  ])
})

test('parseSegment', () => {
  const tokens = parseSegment('[foo]_[bar]:[...buz]_buz_[[qux]]__smth')
  expect(tokens).toEqual([
    { type: 1, value: 'foo' },
    { type: 0, value: '_' },
    { type: 1, value: 'bar' },
    { type: 0, value: ':' },
    { type: 3, value: 'buz' },
    { type: 0, value: '_buz_' },
    { type: 2, value: 'qux' },
    { type: 0, value: '__smth' }
  ])
})

test('getRoutePath', () => {
  const tokens = parseSegment('[foo]_[bar]:[...buz]_buz_[[qux]]__smth')
  expect(getRoutePath(tokens)).toBe(`/:foo()_:bar()::buz(.*)*_buz_:qux?__smth`)
})
