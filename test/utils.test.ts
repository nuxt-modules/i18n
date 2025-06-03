import { resolveLocales } from '../src/utils'
import { parseSegment, getRoutePath } from '../src/utils/route-parsing'
import type { LocaleObject } from '../src/types'
import { vi, beforeEach, afterEach, test, expect, beforeAll } from 'vitest'

vi.mock('pathe', async () => {
  const mod = await vi.importActual<typeof import('pathe')>('pathe')
  return { ...mod, resolve: vi.fn((...args: string[]) => mod.normalize(args.join('/'))) }
})

vi.mock('@nuxt/kit', async importOriginal => {
  const actual = await importOriginal()
  const resolveFiles = () => {
    return [
      ['en', 'json'],
      ['ja', 'json'],
      ['es', 'json'],
      ['es-AR', 'json'],
      ['nl', 'js']
    ].map(pair => `/path/to/project/locales/${pair[0]}.${pair[1]}`)
  }
  return {
    // @ts-expect-error import actual
    ...actual,
    resolveFiles
  }
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
  const resolvedLocales = await resolveLocales('/path/to/project', locales)
  expect(resolvedLocales).toMatchInlineSnapshot(`
    [
      {
        "code": "en",
        "meta": [
          {
            "cache": true,
            "hash": "5c407b7f",
            "path": "/path/to/project/en.json",
            "type": "static",
          },
        ],
      },
      {
        "code": "ja",
        "meta": [
          {
            "cache": true,
            "hash": "0e1b8bd4",
            "path": "/path/to/project/ja.json",
            "type": "static",
          },
        ],
      },
      {
        "code": "es",
        "meta": [
          {
            "cache": true,
            "hash": "c78280fb",
            "path": "/path/to/project/es.json",
            "type": "static",
          },
        ],
      },
      {
        "code": "es-AR",
        "meta": [
          {
            "cache": true,
            "hash": "c78280fb",
            "path": "/path/to/project/es.json",
            "type": "static",
          },
          {
            "cache": true,
            "hash": "65220c0a",
            "path": "/path/to/project/es-AR.json",
            "type": "static",
          },
        ],
      },
      {
        "code": "nl",
        "meta": [
          {
            "cache": false,
            "hash": "b7971e5b",
            "path": "/path/to/project/nl.js",
            "type": "dynamic",
          },
        ],
      },
    ]
  `)
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
  expect(getRoutePath(tokens)).toBe(`/:foo()_:bar()\\::buz(.*)*_buz_:qux?`)
})
