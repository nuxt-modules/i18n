import { createResolver } from '@nuxt/kit'
import { fileURLToPath } from 'node:url'
import { dirname } from 'pathe'
import { hash } from 'ohash'
import type { Resolver } from '@nuxt/kit'
import type { FileMeta, LocaleInfo, LocaleObject, NuxtI18nOptions } from './types'
import type { Nuxt, NuxtConfigLayer } from 'nuxt/schema'
import { getLayerI18n } from './utils'
import { resolveI18nDir } from './layers'

export interface I18nNuxtContext {
  resolver: Resolver
  userOptions: NuxtI18nOptions
  options: Required<NuxtI18nOptions>
  normalizedLocales: LocaleObject<string>[]
  localeCodes: string[]
  localeInfo: LocaleInfo[]
  vueI18nConfigPaths: FileMeta[]
  vueI18nRuntimeOnly: boolean
  distDir: string
  runtimeDir: string
  fullStatic: boolean
  deploymentHash: string
  i18nLayers: LayerWithI18n[]
}

type LayerWithI18n = { config: NuxtConfigLayer, i18n: Partial<NuxtI18nOptions>, i18nDir: string }
const resolver = createResolver(import.meta.url)
const distDir = dirname(fileURLToPath(import.meta.url))
const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

export function createContext(userOptions: NuxtI18nOptions, nuxt: Nuxt): I18nNuxtContext {
  const options = userOptions as Required<NuxtI18nOptions>

  const i18nLayers: LayerWithI18n[] = []
  for (const l of nuxt.options._layers) {
    const i18n = getLayerI18n(l)
    if (!i18n) { continue }
    i18nLayers.push({ config: l, i18n, i18nDir: resolveI18nDir(l, i18n) })
  }

  return {
    options,
    resolver,
    userOptions,
    distDir,
    runtimeDir,
    i18nLayers,
    localeInfo: undefined!,
    localeCodes: undefined!,
    normalizedLocales: undefined!,
    vueI18nConfigPaths: undefined!,
    vueI18nRuntimeOnly: !!(!nuxt.options.dev && !nuxt.options._prepare && options.bundle?.runtimeOnly),
    fullStatic: undefined!,
    deploymentHash: hash(Date.now()).slice(0, 8),
  }
}
