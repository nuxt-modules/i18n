import { describe, expect, test } from 'vitest'
import { createEndpointPredicate, createPrerenderablePredicate, createRuntimeLoaderPredicate } from '../src/runtime/shared/delivery'
import { generateTemplateNuxtI18nOptions } from '../src/template'
import { createContext, resolveDeliveryLocales } from '../src/context'
import { getDefineConfig } from '../src/bundler'
import { resolveLocales, resolveVueI18nConfigInfo } from '../src/utils'
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
  fileless: [],
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
})

// one locale file per kind, classified by the same scan the build runs
const SOURCES: Record<string, string> = {
  [LOCALES.plain]: `export default { a: 'x' }`,
  [LOCALES.dynamic]: `export default defineI18nLocale(() => $fetch('/api'))`,
  [LOCALES.unserializable]: `export default { a: () => 'x' }`,
  [LOCALES.both]: `export default defineI18nLocale(() => ({ a: () => 'x' }))`,
  [LOCALES.appContext]: `export default defineI18nLocale(() => ({ a: useNuxtApp().$greeting }))`
}

type Build = { dev: boolean, ssr: boolean, staticDeploy: boolean, islands?: boolean }

function buildContext(build: Build = { dev: false, ssr: true, staticDeploy: false }) {
  const vfs = Object.fromEntries(Object.keys(SOURCES).map(code => [`/i18n/${code}.ts`, SOURCES[code]!]))
  const locales = Object.keys(SOURCES).map(code => ({ code, file: `${code}.ts` })) as LocaleObject[]
  const localeInfo = resolveLocales('/i18n', locales, vfs)

  const nuxt = { options: { dev: build.dev, ssr: build.ssr, pages: true, app: {}, nitro: {}, _layers: [] } }
  const base = createContext({ experimental: {}, bundle: {}, lazy: true } as never, nuxt as never)
  // Nuxt enables `ssr` after module setup to render the islands of a client-only app
  if (build.islands) { nuxt.options.ssr = true }

  const ctx = {
    ...base,
    ...resolveDeliveryLocales(localeInfo),
    staticDeploy: build.staticDeploy,
    localeCodes: Object.keys(SOURCES),
    localeInfo,
    localeFileMetas: localeInfo.flatMap(x => x.meta),
    normalizedLocales: locales,
    vueI18nConfigPaths: [],
    runtimeDir: '/runtime',
    localeHashes: {}
  } as unknown as ResolvedI18nContext
  ctx.loaderOptions = generateLoaderOptions(ctx)

  return { ctx, nuxt: nuxt as never }
}

/** The loaders `src/template.ts` leaves reachable in the app graphs and the delivery config the runtime gets */
function setupBuild(build: Build) {
  const { ctx, nuxt } = buildContext(build)
  const generated = generateTemplateNuxtI18nOptions(ctx, false, nuxt)
  const entries = /export const localeLoaders = ([\s\S]*?)\nexport const/.exec(generated)?.[1] ?? ''

  const loaders = Object.fromEntries(
    Object.keys(SOURCES).map((code) => {
      const entry = new RegExp(`\\n {2}${code}: \\[([\\s\\S]*?)\\n {2}\\]`).exec(entries)?.[1] ?? ''
      return [code, {
        // a stubbed loader resolves to `{}` instead of reading the locale file
        present: entry.includes('=> import('),
        clientStubbed: entry.includes('import.meta.client')
      }]
    })
  )

  // read from the defines, as `createNuxtI18nContext` does
  const defines = getDefineConfig(ctx, false, nuxt)
  const config = (prerender: boolean): DeliveryConfig => ({
    ssr: defines.__IS_SSR__ === 'true',
    ssg: defines.__IS_SSG__ === 'true',
    prerender,
    dynamic: JSON.parse(defines.__I18N_DYNAMIC_LOCALES__) as string[],
    undeliverable: JSON.parse(defines.__I18N_UNDELIVERABLE_LOCALES__) as string[],
    fileless: JSON.parse(defines.__I18N_FILELESS_LOCALES__) as string[]
  })

  return { loaders, config }
}

describe('(#4093) the build and the runtime agree on where messages come from', () => {
  const BUILDS = [
    { name: 'production ssr', dev: false, ssr: true, staticDeploy: false },
    { name: 'static host', dev: false, ssr: true, staticDeploy: true },
    { name: 'spa', dev: false, ssr: false, staticDeploy: false },
    { name: 'spa with component islands', dev: false, ssr: false, staticDeploy: true, islands: true },
    { name: 'dev', dev: true, ssr: true, staticDeploy: false }
  ]

  test.each(BUILDS)('$name: every locale the runtime loads has its loaders emitted', (build) => {
    const { loaders, config } = setupBuild(build)

    for (const locale of Object.values(LOCALES)) {
      // the client never prerenders, and dev always takes the loaders
      const clientUsesLoaders = build.dev || createRuntimeLoaderPredicate(config(false))(locale)
      const reachableOnClient = loaders[locale]!.present && !loaders[locale]!.clientStubbed

      // a stubbed loader resolves to `{}`, so needing one that was not emitted loses the messages
      expect({ locale, reachable: reachableOnClient || !clientUsesLoaders }).toEqual({ locale, reachable: true })
    }
  })

  test.each(BUILDS)('$name: the ssr graph keeps the loaders prerendering needs', (build) => {
    const { loaders, config } = setupBuild(build)

    for (const locale of Object.values(LOCALES)) {
      const serverUsesLoaders = build.dev || createRuntimeLoaderPredicate(config(true))(locale)
      expect({ locale, reachable: loaders[locale]!.present || !serverUsesLoaders }).toEqual({ locale, reachable: true })
    }
  })

  test('(#4189) a client-only app with component islands loads every locale through its loaders', () => {
    const { loaders, config } = setupBuild({ dev: false, ssr: false, staticDeploy: true, islands: true })
    const usesLoaders = createRuntimeLoaderPredicate(config(false))

    for (const locale of Object.values(LOCALES)) {
      // no page is rendered on the server, so nothing prerenders the endpoint for a static host
      const loaded = usesLoaders(locale) && loaders[locale]!.present && !loaders[locale]!.clientStubbed
      expect({ locale, loaded }).toEqual({ locale, loaded: true })
    }
  })

  test('(#3940) the nitro graph neither imports nor runs a locale file that needs the Nuxt app', () => {
    const { localeLoaders, importStatements } = buildContext().ctx.loaderOptions
    const loaders = localeLoaders[LOCALES.appContext]!

    expect(loaders.map(x => x.loadServer)).toEqual(['() => Promise.resolve({})'])
    // the file is left out of the bundle entirely, its app-only imports would come with it
    expect(importStatements.join('\n')).not.toContain(loaders[0]!.virtualId)
    expect(importStatements.join('\n')).toContain(localeLoaders[LOCALES.dynamic]![0]!.virtualId)
  })

  test('(#4150) the nitro graph neither imports nor runs a vue-i18n config that needs the Nuxt app', () => {
    const configs = {
      '/i18n/plain.config.ts': `export default defineI18nConfig(() => ({ locale: 'en' }))`,
      '/i18n/app.config.ts': `export default defineI18nConfig(() => ({ locale: useRequestURL().host }))`
    }
    const { ctx } = buildContext()
    ctx.vueI18nConfigPaths = Object.keys(configs).map(path => resolveVueI18nConfigInfo(path, configs))
    // the configs are walked back to front, so the app-context one comes out first
    const { vueI18nConfigs, importStatements } = generateLoaderOptions(ctx)
    const [appContext, plain] = vueI18nConfigs

    expect(appContext!.importerServer).toBe('() => Promise.resolve({})')
    // the config is left out of the bundle entirely, its app-only imports would come with it
    expect(importStatements.join('\n')).not.toContain(appContext!.virtualId)
    expect(importStatements.join('\n')).toContain(plain!.virtualId)
  })
})

describe('a locale configured without files', () => {
  const info = resolveLocales('/i18n', [{ code: 'en', file: 'en.ts' }, { code: 'nofiles' }] as LocaleObject[], { '/i18n/en.ts': SOURCES[LOCALES.plain]! })
  const { dynamicLocales, undeliverableLocales, filelessLocales } = resolveDeliveryLocales(info)
  const config = delivery({ dynamic: dynamicLocales, undeliverable: undeliverableLocales, fileless: filelessLocales })

  test('has no messages response to fetch or prerender', () => {
    expect(filelessLocales).toEqual(['nofiles'])
    const prerenderable = createPrerenderablePredicate(config)
    expect(prerenderable('nofiles')).toBe(false)
    expect(prerenderable('en')).toBe(true)

    const fromEndpoint = createEndpointPredicate(createRuntimeLoaderPredicate(config), config.fileless)
    expect(fromEndpoint('nofiles')).toBe(false)
    expect(fromEndpoint('en')).toBe(true)
  })

  test('keeps its preloaded payload messages', () => {
    // the preload plugin empties the payload of undeliverable locales on the server and skips
    // locales behind runtime loaders on the client - the server may hold messages the client lacks
    expect(undeliverableLocales).toEqual([])
    expect(createRuntimeLoaderPredicate(config)('nofiles')).toBe(false)
  })
})
