import { filterLocales, logger, resolveLocales, validateDefaultLocale, validateLocaleCodes } from '../src/utils'
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
            "appContext": false,
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
            "appContext": false,
            "cache": true,
            "hash": "c78280fb",
            "path": "/path/to/project/es.json",
            "serializable": true,
            "type": "static",
          },
          {
            "appContext": false,
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
            "appContext": false,
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
    expect(analyze(`export default { a: 'x', deep: { b: 'y' }, list: ['z'], n: 1, t: \`plain\` }`)).toMatchObject({
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
      serializable: false
    })
  })

  test('reads through TS assertion wrappers', () => {
    expect(analyze(`export default { a: () => 'x' } satisfies Record<string, unknown>`)).toMatchObject({
      type: 'static',
      serializable: false
    })
    expect(analyze(`const messages = { a: () => 'x' } as const\nexport default messages`)).toMatchObject({
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

  test('finds message functions behind branching returns', () => {
    expect(analyze(`export default defineI18nLocale((l) => {
      if (l === 'de') { return { a: () => 'x' } }
      return { a: 'x' }
    })`)).toMatchObject({ serializable: false })
    expect(analyze(`export default defineI18nLocale(() => {
      try { return { a: () => 'x' } } catch { return {} }
    })`)).toMatchObject({ serializable: false })
    // a nested function's return is not the loader's return
    expect(analyze(`export default defineI18nLocale(() => {
      const make = () => ({ a: () => 'x' })
      return { b: 'y' }
    })`)).toMatchObject({ serializable: true })
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

  test('follows variable hops, exported or not', () => {
    // (#2145) the transform only reads an object exported directly, so a hop keeps the file a module
    expect(analyze(`export const messages = { a: () => 'x' }\nexport default messages`)).toMatchObject({
      type: 'unknown',
      serializable: false
    })
    expect(analyze(`const a = { x: () => 'y' }\nconst b = a\nexport default b`)).toMatchObject({
      type: 'unknown',
      serializable: false
    })
    // a self-referential declaration resolves to nothing rather than looping
    expect(analyze(`const a = a\nexport default a`)).toMatchObject({ type: 'unknown' })
  })

  test('reads spread message sources it can resolve', () => {
    expect(analyze(`const base = { a: () => 'x' }\nexport default { ...base }`)).toMatchObject({
      serializable: false
    })
    expect(analyze(`const nested = { a: () => 'x' }\nexport default { deep: { ...nested } }`)).toMatchObject({
      serializable: false
    })
  })

  test('reads returned variables and branch expressions', () => {
    expect(analyze(`export default defineI18nLocale(() => {
      const messages = { a: () => 'x' }
      return messages
    })`)).toMatchObject({ type: 'dynamic', serializable: false })
    expect(analyze(`export default defineI18nLocale(c => { return c ? { a: () => 'x' } : { b: 'y' } })`)).toMatchObject({
      serializable: false
    })
    expect(analyze(`export default defineI18nLocale(async () => { return await { a: () => 'x' } })`)).toMatchObject({
      serializable: false
    })
    // the loader function reached through a variable is still a loader
    expect(analyze(`const loader = () => ({ a: 'x' })\nexport default defineI18nLocale(loader)`)).toMatchObject({
      type: 'dynamic',
      serializable: true
    })
  })

  test('(#3961) a computed key is not a readable resource', () => {
    // the bundler's resource transform cannot parse one either, so it must stay a module
    expect(analyze(`const S = { HP: 'hp' }\nexport default { stats: { [S.HP]: 'HP' } }`)).toMatchObject({
      type: 'unknown',
      serializable: true
    })
    expect(analyze(`export default { [key]: () => 'x' }`)).toMatchObject({ type: 'unknown', serializable: false })
    expect(analyze(`export default { a: 'x' }`)).toMatchObject({ type: 'static' })
  })

  test('(#3308) a value the resource transform cannot re-emit is not a readable resource', () => {
    // it would emit `hello: hello` - the message resolves to nothing rather than to its value
    expect(analyze(`export default { hello: 'Hello' + 'World' }`)).toMatchObject({
      type: 'unknown',
      serializable: true
    })
    expect(analyze(`export default { a: makeMessage() }`)).toMatchObject({ type: 'unknown' })
    expect(analyze(`export default { n: -1 }`)).toMatchObject({ type: 'unknown' })
    expect(analyze(`export default { deep: { a: 'Hello' + 'World' }, b: 'y' }`)).toMatchObject({ type: 'unknown' })
    // an interpolation is dropped from a template literal, leaving only its static parts
    expect(analyze('export default { a: `Hello ${name}` }')).toMatchObject({ type: 'unknown' })
    // an item it cannot read is dropped, shifting the rest of the array up
    expect(analyze(`export default { list: ['a' + 'b', 'c'] }`)).toMatchObject({ type: 'unknown' })
    expect(analyze(`export default { list: [ref, 'c'] }`)).toMatchObject({ type: 'unknown' })
    // a spread of anything but a reference is emitted as `...false`
    expect(analyze(`export default { ...getBase() }`)).toMatchObject({ type: 'unknown' })
  })

  test('(#3308) values it re-emits as written stay readable', () => {
    // the declaration a reference points at is emitted alongside the messages, so it resolves
    expect(analyze(`const greeting = 'Hello' + 'World'\nexport default { hello: greeting }`)).toMatchObject({
      type: 'static',
      serializable: true
    })
    expect(analyze(`import en from './en.json'\nexport default { en }`)).toMatchObject({ type: 'static' })
    expect(analyze(`const nested = { [key]: 'x' }\nexport default { deep: nested }`)).toMatchObject({
      type: 'static'
    })
    expect(analyze(`export default { ...base, a: 'x' }`)).toMatchObject({ type: 'static' })
    expect(analyze(`export default { list: [{ a: 'x' }, ['y'], 1, true, null] }`)).toMatchObject({ type: 'static' })
  })

  test('(#3940) a file reaching for the Nuxt app cannot be run by the server', () => {
    expect(analyze(`export default defineI18nLocale(async () => {
      const { $store } = useNuxtApp()
      return { a: $store.greeting }
    })`)).toMatchObject({ type: 'dynamic', appContext: true })
    expect(analyze(`export default defineI18nLocale(() => ({ a: useCookie('tenant').value }))`)).toMatchObject({
      appContext: true
    })
    // module scope runs wherever the file is imported, the same as a loader body
    expect(analyze(`const tenant = useRequestHeaders(['host'])\nexport default { a: tenant.host }`)).toMatchObject({
      appContext: true
    })
    expect(analyze(`import { useNuxtApp } from '#app'\nexport default defineI18nLocale(() => ({}))`)).toMatchObject({
      appContext: true
    })
    // an alias hides the call, so the import is what gives this away
    expect(analyze(`export default defineI18nLocale(async () => {
      const { useNuxtApp: nuxt } = await import('#app/nuxt')
      return { a: nuxt().$x }
    })`)).toMatchObject({ appContext: true })
  })

  test('what nitro provides too keeps a locale on the endpoint', () => {
    expect(analyze(`export default defineI18nLocale(() => ({ a: useRuntimeConfig().public.x }))`)).toMatchObject({
      appContext: false
    })
    expect(analyze(`export default defineI18nLocale(l => $fetch('/api/' + l))`)).toMatchObject({ appContext: false })
    expect(analyze(`export default { a: 'x' }`)).toMatchObject({ appContext: false })
    expect(analyze(`export default {}`, 'locale.json')).toMatchObject({ appContext: false })
  })

  test('a shape it cannot read at all is assumed to hold message functions', () => {
    // being wrong here drops messages silently (#3880), so the locale keeps its loaders instead
    expect(analyze(`export default Object.freeze({ a: 'x' })`)).toMatchObject({
      type: 'unknown',
      serializable: false
    })
    expect(analyze(`export { default } from './en'`)).toMatchObject({ type: 'unknown', serializable: false })
  })
})

describe('validateDefaultLocale', () => {
  test('warns when `defaultLocale` names no configured locale', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})

    validateDefaultLocale('ja', ['en', 'fr'])
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]![0]).toContain('"ja"')

    warn.mockClear()
    // a layer may contribute the locale, so this is only checkable after they are merged
    validateDefaultLocale('ja', ['en', 'fr', 'ja'])
    validateDefaultLocale('', ['en', 'fr'])
    validateDefaultLocale(undefined, ['en', 'fr'])
    expect(warn).not.toHaveBeenCalled()

    warn.mockRestore()
  })
})
