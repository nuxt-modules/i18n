import { parseSegment, getRoutePath, resolveLocales } from '../src/utils'
import type { LocaleObject } from 'vue-i18n-routing'

vi.mock('@nuxt/kit', () => {
  const resolveFiles = () => {
    return ['en', 'ja', 'es', 'es-AR'].map(l => `/path/to/project/locales/${l}.json`)
  }
  return { resolveFiles }
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
    }
  ] as LocaleObject[]
  const resolvedLocales = await resolveLocales('/path/to/project/locales', locales)
  expect(resolvedLocales).toEqual([
    {
      path: '/path/to/project/locales/en.json',
      code: 'en',
      file: 'en.json'
    },
    {
      path: '/path/to/project/locales/ja.json',
      code: 'ja',
      file: 'ja.json'
    },
    {
      path: '/path/to/project/locales/es.json',
      code: 'es',
      file: 'es.json'
    },
    {
      paths: ['/path/to/project/locales/es.json', '/path/to/project/locales/es-AR.json'],
      code: 'es-AR',
      files: ['es.json', 'es-AR.json']
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
