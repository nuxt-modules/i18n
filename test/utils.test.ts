import { filterLocales, resolveLocales } from '../src/utils'
import type { LocaleObject, NuxtI18nOptions } from '../src/types'
import type { I18nNuxtContext } from '../src/context'
import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import { vi, describe, test, expect } from 'vitest'

vi.mock('pathe', async () => {
  const mod = await vi.importActual<typeof import('pathe')>('pathe')
  return { ...mod, resolve: vi.fn((...args: string[]) => mod.normalize(args.join('/'))) }
})

function createLayer(i18n?: NuxtI18nOptions): NuxtConfigLayer {
  return { config: { i18n } } as unknown as NuxtConfigLayer
}

function createContext(locales: NuxtI18nOptions['locales']): I18nNuxtContext {
  return { options: { locales } } as I18nNuxtContext
}

function createNuxt(layers: NuxtConfigLayer[]): Nuxt {
  return { options: { _layers: layers } } as unknown as Nuxt
}

describe('filterLocales', () => {
  test('uses `onlyLocales` from the running project', () => {
    const ctx = createContext(['en', 'fr', 'nl'])
    const nuxt = createNuxt([
      createLayer({ bundle: { onlyLocales: 'en' } }),
      createLayer({ bundle: { onlyLocales: 'fr' } })
    ])

    expect(filterLocales(ctx, nuxt)).toEqual(['en'])
  })

  test('falls back to the first downstream layer that specifies `onlyLocales`', () => {
    const ctx = createContext(['en', 'fr', 'nl'])
    const nuxt = createNuxt([
      createLayer({}),
      createLayer({ bundle: { onlyLocales: 'fr' } }),
      createLayer({ bundle: { onlyLocales: 'nl' } })
    ])

    expect(filterLocales(ctx, nuxt)).toEqual(['fr'])
  })

  test('returns all locales when no layer specifies `onlyLocales`', () => {
    const ctx = createContext(['en', 'fr', 'nl'])
    const nuxt = createNuxt([createLayer({}), createLayer({ bundle: {} })])

    expect(filterLocales(ctx, nuxt)).toEqual(['en', 'fr', 'nl'])
  })

  test('treats an explicit empty `onlyLocales` as specified and stops the search', () => {
    const ctx = createContext(['en', 'fr', 'nl'])
    const nuxt = createNuxt([
      createLayer({ bundle: { onlyLocales: [] } }),
      createLayer({ bundle: { onlyLocales: 'fr' } })
    ])

    // empty `onlyLocales` means no filtering; the downstream `'fr'` must not be applied
    expect(filterLocales(ctx, nuxt)).toEqual(['en', 'fr', 'nl'])
  })
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
