import { describe, expect, test } from 'vitest'
import { createPrerenderablePredicate, createRuntimeLoaderPredicate, messagesRoutePath } from '../src/runtime/shared/delivery'
import { generateTemplateNuxtI18nOptions } from '../src/template'
import { resolveDeliveryLocales } from '../src/context'
import { resolveLocales } from '../src/utils'
import { generateLoaderOptions } from '../src/gen'
import type { DeliveryConfig } from '../src/runtime/shared/delivery'
import type { ResolvedI18nContext } from '../src/context'
import type { LocaleObject } from '../src/types'

const LOCALES = { plain: 'en', dynamic: 'dy', unserializable: 'un', both: 'bo', appContext: 'ap' }

const delivery = (overrides: Partial<DeliveryConfig> = {}): DeliveryConfig => ({
  ssr: true,
  ssg: false,
  prerender: false,
  dynamic: [LOCALES.dynamic, LOCALES.both, LOCALES.appContext],
  undeliverable: [LOCALES.unserializable, LOCALES.both, LOCALES.appContext],
  ...overrides
})

describe('message delivery', () => {
  test('(#3940) a locale the server cannot produce always runs its loaders', () => {
    for (const config of [
      delivery(),
      delivery({ ssg: true }),
      delivery({ prerender: true }),
      delivery({ ssr: false })
    ]) {
      expect(createRuntimeLoaderPredicate(config)(LOCALES.appContext)).toBe(true)
    }
  })

  test('a locale whose messages JSON cannot carry always runs its loaders', () => {
    for (const config of [
      delivery(),
      delivery({ ssg: true }),
      delivery({ prerender: true }),
      delivery({ ssr: false })
    ]) {
      const usesLoaders = createRuntimeLoaderPredicate(config)
      expect(usesLoaders(LOCALES.unserializable)).toBe(true)
      expect(usesLoaders(LOCALES.both)).toBe(true)
    }
  })

  test('a dynamic locale reads the endpoint only where one is still served', () => {
    // a server renders it live, so the loaders stay out of the graph
    expect(createRuntimeLoaderPredicate(delivery())(LOCALES.dynamic)).toBe(false)
    // prerendering would bake a snapshot, and a static host has no handler left
    expect(createRuntimeLoaderPredicate(delivery({ prerender: true }))(LOCALES.dynamic)).toBe(true)
    expect(createRuntimeLoaderPredicate(delivery({ ssg: true }))(LOCALES.dynamic)).toBe(true)
  })

  test('without a server every locale runs its loaders', () => {
    const usesLoaders = createRuntimeLoaderPredicate(delivery({ ssr: false }))
    for (const locale of Object.values(LOCALES)) {
      expect(usesLoaders(locale)).toBe(true)
    }
  })

  test('only locales with stable, serializable responses are prerenderable', () => {
    const deliverable = createPrerenderablePredicate(delivery())
    expect(deliverable(LOCALES.plain)).toBe(true)
    expect(deliverable(LOCALES.dynamic)).toBe(false)
    expect(deliverable(LOCALES.unserializable)).toBe(false)
    expect(deliverable(LOCALES.both)).toBe(false)
    expect(deliverable(LOCALES.appContext)).toBe(false)
  })

  test('(#4036) a locale code with characters that would otherwise split the URL stays a single segment', () => {
    // `/` (or `?`, `#`, ...) in a locale code would otherwise be read as extra path segments or
    // query/hash markers, so the messages endpoint (`:hash/:locale/messages.json`) never matches
    expect(messagesRoutePath('abc123', 'at/de')).toBe('abc123/at%2Fde/messages.json')
    expect(messagesRoutePath('abc123', 'en')).toBe('abc123/en/messages.json')
  })

  test('(#4142) a locale needing URL encoding also runs its own loaders', () => {
    // nitro's prerender crawler can only carry a route through unencoded, so it can never bake a
    // static messages file for this locale, it has to fall back on running its own loaders instead
    const locales = [{ code: 'en', file: 'en.json' }, { code: 'en/formal', file: 'en.json' }] as LocaleObject[]
    const { dynamicLocales } = resolveDeliveryLocales(resolveLocales('/i18n', locales, {}))
    expect(dynamicLocales).toEqual(['en/formal'])
  })
})

// one locale file per kind, classified by the same scan the build runs
const SOURCES: Record<string, string> = {
  [LOCALES.plain]: `export default { a: 'x' }`,
  [LOCALES.dynamic]: `export default defineI18nLocale(() => $fetch('/api'))`,
  [LOCALES.unserializable]: `export default { a: () => 'x' }`,
  [LOCALES.both]: `export default defineI18nLocale(() => ({ a: () => 'x' }))`,
  [LOCALES.appContext]: `export default defineI18nLocale(() => ({ a: useNuxtApp().$greeting }))`
}

function buildContext(staticDeploy = false) {
  const vfs = Object.fromEntries(Object.keys(SOURCES).map(code => [`/i18n/${code}.ts`, SOURCES[code]!]))
  const locales = Object.keys(SOURCES).map(code => ({ code, file: `${code}.ts` })) as LocaleObject[]
  const localeInfo = resolveLocales('/i18n', locales, vfs)

  const ctx = {
    options: { experimental: {}, bundle: {}, lazy: true },
    ...resolveDeliveryLocales(localeInfo),
    staticDeploy,
    localeCodes: Object.keys(SOURCES),
    localeInfo,
    normalizedLocales: locales,
    vueI18nConfigPaths: [],
    runtimeDir: '/runtime',
    localeHashes: {}
  } as unknown as ResolvedI18nContext
  ctx.loaderOptions = generateLoaderOptions(ctx)

  return ctx
}

/** The loaders `src/template.ts` leaves reachable in each graph, per locale */
function emittedLoaders(build: { dev: boolean, ssr: boolean, staticDeploy: boolean }, server: boolean) {
  const ctx = buildContext(build.staticDeploy)
  const nuxt = { options: { dev: build.dev, ssr: build.ssr, nitro: {} } }
  const generated = generateTemplateNuxtI18nOptions(ctx, server, nuxt as never)
  const loaders = /export const localeLoaders = ([\s\S]*?)\nexport const/.exec(generated)?.[1] ?? ''

  return Object.fromEntries(
    Object.keys(SOURCES).map((code) => {
      const entry = new RegExp(`\\n {2}${code}: \\[([\\s\\S]*?)\\n {2}\\]`).exec(loaders)?.[1] ?? ''
      return [code, {
        // a stubbed loader resolves to `{}` instead of reading the locale file
        present: entry.includes('=> import('),
        clientStubbed: entry.includes('import.meta.client')
      }]
    })
  )
}

describe('(#4093) the build and the runtime agree on where messages come from', () => {
  const BUILDS = [
    { name: 'production ssr', dev: false, ssr: true, staticDeploy: false },
    { name: 'static host', dev: false, ssr: true, staticDeploy: true },
    { name: 'spa', dev: false, ssr: false, staticDeploy: false },
    { name: 'dev', dev: true, ssr: true, staticDeploy: false }
  ]

  test.each(BUILDS)('$name: every locale the runtime loads has its loaders emitted', (build) => {
    const client = emittedLoaders(build, false)
    const config = delivery({ ssr: build.ssr, ssg: build.staticDeploy })

    for (const locale of Object.values(LOCALES)) {
      // the client never prerenders, and dev always takes the loaders
      const clientUsesLoaders = build.dev || createRuntimeLoaderPredicate({ ...config, prerender: false })(locale)
      const reachableOnClient = client[locale]!.present && !client[locale]!.clientStubbed

      // a stubbed loader resolves to `{}`, so needing one that was not emitted loses the messages
      expect({ locale, reachable: reachableOnClient || !clientUsesLoaders }).toEqual({ locale, reachable: true })
    }
  })

  test.each(BUILDS)('$name: the ssr graph keeps the loaders prerendering needs', (build) => {
    const app = emittedLoaders(build, false)
    const config = delivery({ ssr: build.ssr, ssg: build.staticDeploy, prerender: true })

    for (const locale of Object.values(LOCALES)) {
      const serverUsesLoaders = build.dev || createRuntimeLoaderPredicate(config)(locale)
      expect({ locale, reachable: app[locale]!.present || !serverUsesLoaders }).toEqual({ locale, reachable: true })
    }
  })

  test('(#3940) the nitro graph neither imports nor runs a locale file that needs the Nuxt app', () => {
    const { localeLoaders, importStatements } = buildContext().loaderOptions
    const loaders = localeLoaders[LOCALES.appContext]!

    expect(loaders.map(x => x.loadServer)).toEqual(['() => Promise.resolve({})'])
    // the file is left out of the bundle entirely, its app-only imports would come with it
    expect(importStatements.join('\n')).not.toContain(loaders[0]!.virtualId)
    expect(importStatements.join('\n')).toContain(localeLoaders[LOCALES.dynamic]![0]!.virtualId)
  })
})
