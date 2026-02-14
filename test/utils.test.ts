import { resolveLocales } from '../src/utils'
import type { LocaleObject } from '../src/types'
import { vi, test, expect } from 'vitest'

vi.mock('pathe', async () => {
  const mod = await vi.importActual<typeof import('pathe')>('pathe')
  return { ...mod, resolve: vi.fn((...args: string[]) => mod.normalize(args.join('/'))) }
})

test('resolveLocales', async () => {
  const locales = [
    {
      code: 'en',
      files: ['en.json']
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
  const resolvedLocales = resolveLocales('/path/to/project', locales, { '/path/to/project/nl.js': 'export default defineI18nLocale(() => { return {} })' })
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
