import { filterLocales, resolveLocales, validateLocaleCodes } from '../src/utils'
import type { NuxtI18nOptions } from '../src/types'
import type { I18nNuxtContext } from '../src/context'
import { vi, describe, test, expect } from 'vitest'

vi.mock('pathe', async () => {
  const mod = await vi.importActual<typeof import('pathe')>('pathe')
  return { ...mod, resolve: vi.fn((...args: string[]) => mod.normalize(args.join('/'))) }
})

function createContext(locales: NuxtI18nOptions['locales'], layerI18ns: NuxtI18nOptions[] = []): I18nNuxtContext {
  return {
    options: { locales },
    i18nLayers: layerI18ns.map(i18n => ({ i18n })),
  } as I18nNuxtContext
}

describe('filterLocales', () => {
  test('uses `onlyLocales` from the running project', () => {
    const ctx = createContext(['en', 'fr', 'nl'], [
      { bundle: { onlyLocales: 'en' } },
      { bundle: { onlyLocales: 'fr' } },
    ])

    expect(filterLocales(ctx)).toEqual(['en'])
  })

  test('falls back to the first downstream layer that specifies `onlyLocales`', () => {
    const ctx = createContext(['en', 'fr', 'nl'], [
      {},
      { bundle: { onlyLocales: 'fr' } },
      { bundle: { onlyLocales: 'nl' } },
    ])

    expect(filterLocales(ctx)).toEqual(['fr'])
  })

  test('returns all locales when no layer specifies `onlyLocales`', () => {
    const ctx = createContext(['en', 'fr', 'nl'], [{}, { bundle: {} }])

    expect(filterLocales(ctx)).toEqual(['en', 'fr', 'nl'])
  })

  test('treats an explicit empty `onlyLocales` as specified and stops the search', () => {
    const ctx = createContext(['en', 'fr', 'nl'], [
      { bundle: { onlyLocales: [] } },
      { bundle: { onlyLocales: 'fr' } },
    ])

    // empty `onlyLocales` means no filtering; the downstream `'fr'` must not be applied
    expect(filterLocales(ctx)).toEqual(['en', 'fr', 'nl'])
  })
})

describe('validateLocaleCodes', () => {
  test('accepts path-segment-safe codes', () => {
    expect(() => validateLocaleCodes(['en', 'de-AT', 'zh-Hans', 'pt_BR', 'kr.v2'])).not.toThrow()
  })

  test.each(['at/de', 'at\\de', 'en us', 'en?', 'en#x', 'en%20', 'en:us', ''])('throws for %j', code => {
    expect(() => validateLocaleCodes([code])).toThrowError('[nuxt-i18n] Invalid locale code')
  })

  test('lists all invalid codes', () => {
    expect(() => validateLocaleCodes(['en', 'at/de', 'at/en'])).toThrowError(
      /Invalid locale codes: "at\/de", "at\/en"/,
    )
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
