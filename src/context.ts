import { createResolver } from '@nuxt/kit'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'pathe'
import { assign, isString } from '@intlify/shared'
import { applyLayerOptions, resolveLayerVueI18nConfigInfo } from './layers'
import { computeLocaleHashes, filterLocales, getLayerI18n, normalizeDomainLocale, resolveLocales, validateLocaleCodes } from './utils'
import { generateLoaderOptions } from './gen'

import type { Resolver } from '@nuxt/kit'
import type { FileMeta, LocaleInfo, LocaleObject, NuxtI18nOptions } from './types'
import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'

export interface I18nNuxtContext {
  resolver: Resolver
  options: Required<NuxtI18nOptions>
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
  vueI18nConfigPaths: Omit<FileMeta, 'cache'>[]
  localeHashes: Record<string, string>
  fullStatic: boolean
  loaderOptions: ReturnType<typeof generateLoaderOptions>
}

type LayerWithI18n = { config: NuxtConfigLayer, i18n: Partial<NuxtI18nOptions>, i18nDir: string, i18nDetector?: string }
const resolver = createResolver(import.meta.url)
const distDir = dirname(fileURLToPath(import.meta.url))
const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

export function createContext(userOptions: NuxtI18nOptions, nuxt: Nuxt): I18nNuxtContext {
  const options = userOptions as Required<NuxtI18nOptions>

  const i18nLayers: LayerWithI18n[] = []
  for (const l of nuxt.options._layers) {
    const i18n = getLayerI18n(l)
    if (!i18n) { continue }
    const i18nDir = resolve(l.config.rootDir, i18n.restructureDir ?? 'i18n')
    const i18nDetector = i18n.experimental?.localeDetector ? resolver.resolve(i18nDir, i18n.experimental.localeDetector) : undefined
    i18nLayers.push({ config: l, i18n, i18nDir, i18nDetector })
  }

  return { options, resolver, distDir, runtimeDir, i18nLayers }
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

  const resolved = assign(ctx as ResolvedI18nContext, {
    normalizedLocales,
    localeCodes,
    localeInfo,
    localeFileMetas,
    localeFilePaths: [...new Set(localeFileMetas.map(meta => meta.path))],
    vueI18nConfigPaths,
    /**
     * content-hash locale files now that all locales and configs are known,
     * used to cache-bust per-locale message server routes without churning
     * on every build
     */
    localeHashes: computeLocaleHashes(localeInfo, vueI18nConfigPaths),
    fullStatic: localeFileMetas.every(meta => meta.type === 'static' || meta.cache !== false),
  })
  resolved.loaderOptions = generateLoaderOptions(resolved)

  return resolved
}
