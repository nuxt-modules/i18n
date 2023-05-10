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
      path: '/path/to/project/locales/en.json',
      code: 'en',
      file: 'en.json',
      hash: '18f36abf',
      type: 'static'
    },
    {
      path: '/path/to/project/locales/ja.json',
      code: 'ja',
      file: 'ja.json',
      hash: '147c88eb',
      type: 'static'
    },
    {
      path: '/path/to/project/locales/es.json',
      code: 'es',
      file: 'es.json',
      hash: 'f4490d2c',
      type: 'static'
    },
    {
      paths: ['/path/to/project/locales/es.json', '/path/to/project/locales/es-AR.json'],
      code: 'es-AR',
      files: ['es.json', 'es-AR.json'],
      hashes: ['f4490d2c', '96ad3952'],
      types: ['static', 'static']
    },
    {
      path: '/path/to/project/locales/nl.js',
      code: 'nl',
      file: 'nl.js',
      hash: '68b1a130',
      type: 'dynamic'
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
