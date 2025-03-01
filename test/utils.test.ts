import { resolveLocales } from '../src/utils'
import { parseSegment, getRoutePath } from '../src/utils/route-parsing'
import type { LocaleObject } from '../src/types'
import { vi, beforeEach, afterEach, test, expect } from 'vitest'

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
  const resolvedLocales = await resolveLocales('/path/to/project', locales, '/path/to/project/.nuxt')
  expect(resolvedLocales).toMatchInlineSnapshot(`
    [
      {
        "code": "en",
        "files": [
          {
            "cache": true,
            "path": "en.json",
          },
        ],
        "meta": [
          {
            "file": {
              "cache": true,
              "path": "en.json",
            },
            "hash": "5c407b7f",
            "key": "locale__path_to_project_en_json",
            "loadPath": "../en.json",
            "path": "/path/to/project/en.json",
            "type": "static",
          },
        ],
      },
      {
        "code": "ja",
        "files": [
          {
            "cache": true,
            "path": "ja.json",
          },
        ],
        "meta": [
          {
            "file": {
              "cache": true,
              "path": "ja.json",
            },
            "hash": "0e1b8bd4",
            "key": "locale__path_to_project_ja_json",
            "loadPath": "../ja.json",
            "path": "/path/to/project/ja.json",
            "type": "static",
          },
        ],
      },
      {
        "code": "es",
        "files": [
          {
            "cache": true,
            "path": "es.json",
          },
        ],
        "meta": [
          {
            "file": {
              "cache": true,
              "path": "es.json",
            },
            "hash": "c78280fb",
            "key": "locale__path_to_project_es_json",
            "loadPath": "../es.json",
            "path": "/path/to/project/es.json",
            "type": "static",
          },
        ],
      },
      {
        "code": "es-AR",
        "files": [
          {
            "cache": true,
            "path": "es.json",
          },
          {
            "cache": true,
            "path": "es-AR.json",
          },
        ],
        "meta": [
          {
            "file": {
              "cache": true,
              "path": "es.json",
            },
            "hash": "c78280fb",
            "key": "locale__path_to_project_es_json",
            "loadPath": "../es.json",
            "path": "/path/to/project/es.json",
            "type": "static",
          },
          {
            "file": {
              "cache": true,
              "path": "es-AR.json",
            },
            "hash": "65220c0a",
            "key": "locale__path_to_project_es_AR_json",
            "loadPath": "../es-AR.json",
            "path": "/path/to/project/es-AR.json",
            "type": "static",
          },
        ],
      },
      {
        "code": "nl",
        "files": [
          {
            "cache": false,
            "path": "nl.js",
          },
        ],
        "meta": [
          {
            "file": {
              "cache": false,
              "path": "nl.js",
            },
            "hash": "b7971e5b",
            "key": "locale__path_to_project_nl_js",
            "loadPath": "../nl.js",
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
