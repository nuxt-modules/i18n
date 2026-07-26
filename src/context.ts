import { createResolver } from '@nuxt/kit'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'pathe'
import { assign, isString } from '@intlify/shared'
import { applyLayerOptions, resolveLayerVueI18nConfigInfo } from './layers'
import { computeLocaleHashes, filterLocales, getLayerI18n, normalizeDomainLocale, resolveLocales, validateLocaleCodes } from './utils'
import { resolveRawResourcePaths } from './resources'
import { generateLoaderOptions } from './gen'

import type { Resolver } from '@nuxt/kit'
import type { FileMeta, LocaleInfo, LocaleObject, NuxtI18nOptions } from './types'
import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'

export interface I18nNuxtContext {
  resolver: Resolver
  options: Required<NuxtI18nOptions>
  /** `nuxt.options.i18n` unmerged with defaults, to detect explicitly set options */
  rawOptions: Partial<NuxtI18nOptions>
  distDir: string
  runtimeDir: string
  i18nLayers: LayerWithI18n[]
}

/**
 * Locale-derived context, resolved in `modules:done` once all modules have registered locales.
 */
export interface ResolvedI18nContext extends I18nNuxtContext {
  normalizedLocales: LocaleObject<string>[]
  localeCodes: string[]
  localeInfo: LocaleInfo[]
  /** flattened `localeInfo` file metas */
  localeFileMetas: FileMeta[]
  /** unique resolved locale file paths */
  localeFilePaths: string[]
  /** locale file paths served as raw messages instead of being handed to the bundler */
  rawResourcePaths: Set<string>
  vueI18nConfigPaths: Omit<FileMeta, 'cache'>[]
  localeHashes: Record<string, string>
  /**
   * Locales whose messages are not build-time content and can only be produced by running their
   * loaders. Everything else can be served from the (prerenderable) messages endpoint.
   */
  dynamicLocales: string[]
  loaderOptions: ReturnType<typeof generateLoaderOptions>
}

/** A file the build cannot resolve to fixed content - its loader has to run at runtime */
const isDynamicMeta = (meta: FileMeta) => meta.type !== 'static' && meta.cache === false

type LayerWithI18n = { config: NuxtConfigLayer, i18n: Partial<NuxtI18nOptions>, i18nDir: string, i18nDetector?: string }
const resolver = createResolver(import.meta.url)
const distDir = dirname(fileURLToPath(import.meta.url))
const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

export function createContext(userOptions: NuxtI18nOptions, nuxt: Nuxt): I18nNuxtContext {
  const options = userOptions as Required<NuxtI18nOptions>
  // the `i18n` key may be configured with a falsy non-object value (#3900)
  const rawOptions = (nuxt.options.i18n || {}) as Partial<NuxtI18nOptions>

  const i18nLayers: LayerWithI18n[] = []
  for (const l of nuxt.options._layers) {
    const i18n = getLayerI18n(l)
    if (!i18n) { continue }
    const i18nDir = resolve(l.config.rootDir, i18n.restructureDir ?? 'i18n')
    const i18nDetector = i18n.experimental?.localeDetector ? resolver.resolve(i18nDir, i18n.experimental.localeDetector) : undefined
    i18nLayers.push({ config: l, i18n, i18nDir, i18nDetector })
  }

  return { options, rawOptions, resolver, distDir, runtimeDir, i18nLayers }
}

export async function resolveContext(ctx: I18nNuxtContext, nuxt: Nuxt): Promise<ResolvedI18nContext> {
  ctx.options.locales = await applyLayerOptions(ctx, nuxt)
  ctx.options.locales = filterLocales(ctx)

  const normalizedLocales = ctx.options.locales.map(x =>
    normalizeDomainLocale(isString(x) ? { code: x, language: x } : x),
  )
  const localeCodes = normalizedLocales.map(locale => locale.code)
  validateLocaleCodes(localeCodes)

  const localeInfo = resolveLocales(nuxt.options.srcDir, normalizedLocales, nuxt.vfs)
  const localeFileMetas = localeInfo.flatMap(x => x.meta)
  const vueI18nConfigPaths = await resolveLayerVueI18nConfigInfo(ctx)

  const localeFilePaths = [...new Set(localeFileMetas.map(meta => meta.path))]
  const rawResourcePaths = ctx.options.experimental.optimizeMessageBundling
    ? resolveRawResourcePaths(localeFilePaths)
    : new Set<string>()

  // raw resources ship as lazily read nitro server assets, keeping message data out of the
  // server bundles - dev keeps eager imports for HMR and virtual file support
  if (!nuxt.options.dev) {
    for (const meta of localeFileMetas) {
      if (rawResourcePaths.has(meta.path)) {
        meta.assetKey = `${meta.hash}.json`
      }
    }
  }

  const dynamicLocales = localeInfo.filter(x => x.meta.some(isDynamicMeta)).map(x => x.code)

  const resolved = assign(ctx as ResolvedI18nContext, {
    normalizedLocales,
    localeCodes,
    localeInfo,
    localeFileMetas,
    localeFilePaths,
    rawResourcePaths,
    vueI18nConfigPaths,
    /**
     * content-hash locale files now that all locales and configs are known,
     * used to cache-bust per-locale message server routes without churning
     * on every build
     */
    localeHashes: computeLocaleHashes(localeInfo, vueI18nConfigPaths),
    dynamicLocales,
  })
  resolved.loaderOptions = generateLoaderOptions(resolved)

  return resolved
}
