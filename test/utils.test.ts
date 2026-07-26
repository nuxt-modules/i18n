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
            "serializable": true,
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
            "serializable": true,
            "type": "static",
          },
          {
            "cache": true,
            "hash": "65220c0a",
            "path": "/path/to/project/es-AR.json",
            "serializable": true,
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
            "serializable": true,
            "type": "dynamic",
          },
        ],
      },
    ]
  `)
})

describe('message source classification', () => {
  const analyze = (source: string, file = 'locale.ts') =>
    resolveLocales('/project', [{ code: 'en', file }] as LocaleObject[], { [`/project/${file}`]: source })[0]!.meta[0]!

  test('reads plain data as endpoint deliverable', () => {
    expect(analyze(`export default { a: 'x', deep: { b: 'y' }, list: ['z'], n: -1, t: \`plain\` }`)).toMatchObject({
      type: 'static',
      serializable: true
    })
    expect(analyze(`export default {}`, 'locale.json')).toMatchObject({ type: 'static', serializable: true })
  })

  test('(#3880) a message function makes the messages undeliverable', () => {
    expect(analyze(`export default { a: () => 'x' }`)).toMatchObject({ type: 'static', serializable: false })
    expect(analyze(`export default { deep: { a: ctx => ctx.named('n') } }`)).toMatchObject({ serializable: false })
    expect(analyze(`export default { a() { return 'x' } }`)).toMatchObject({ serializable: false })
    expect(analyze(`const messages = { a: () => 'x' }\nexport default messages`)).toMatchObject({
      type: 'static',
      serializable: false
    })
  })

  test('reads through TS assertion wrappers', () => {
    expect(analyze(`export default { a: () => 'x' } satisfies Record<string, unknown>`)).toMatchObject({
      type: 'static',
      serializable: false
    })
    expect(analyze(`const messages = { a: () => 'x' } as const\nexport default messages`)).toMatchObject({
      type: 'static',
      serializable: false
    })
    expect(analyze(`export default { a: (() => 'x') as unknown }`)).toMatchObject({ serializable: false })
    expect(analyze(`export default { a: 'x' as string }`)).toMatchObject({ type: 'static', serializable: true })
  })

  test('reads through the loader wrapper', () => {
    expect(analyze(`export default defineI18nLocale(() => ({ a: () => 'x' }))`)).toMatchObject({
      type: 'dynamic',
      serializable: false
    })
    expect(analyze(`export default defineI18nLocale(() => { return { a: () => 'x' } })`)).toMatchObject({
      serializable: false
    })
    expect(analyze(`export default defineI18nLocale(() => ({ a: 'x' }))`)).toMatchObject({ serializable: true })
  })

  test('messages it cannot read are left on the endpoint', () => {
    // a loader fetching its messages could not have carried functions in the first place
    expect(analyze(`export default defineI18nLocale(l => $fetch('/api/' + l))`)).toMatchObject({
      type: 'dynamic',
      serializable: true
    })
  })

  test('only functions are ruled out, not every non-literal value', () => {
    // anything else still evaluates to a value JSON can carry
    expect(analyze(`export default defineI18nLocale(() => ({ a: useRuntimeConfig().public.x }))`)).toMatchObject({
      serializable: true
    })
    expect(analyze(`export default { ...base, a: 'x' }`)).toMatchObject({ serializable: true })
    expect(analyze(`import en from './en.json'\nexport default { en }`)).toMatchObject({ serializable: true })
    expect(analyze(`export default { a: makeMessage() }`)).toMatchObject({ serializable: true })
  })
})
