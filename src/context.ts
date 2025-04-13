import { createResolver } from '@nuxt/kit'
import type { Resolver } from '@nuxt/kit'
import type { LocaleInfo, LocaleObject, NuxtI18nOptions, VueI18nConfigPathInfo } from './types'

export interface I18nNuxtContext {
  resolver: Resolver
  userOptions: NuxtI18nOptions
  options: Required<NuxtI18nOptions>
  normalizedLocales: LocaleObject<string>[]
  localeCodes: string[]
  localeInfo: LocaleInfo[]
  vueI18nConfigPaths: Required<VueI18nConfigPathInfo>[]
}

const resolver = createResolver(import.meta.url)

export function createContext(userOptions: NuxtI18nOptions): I18nNuxtContext {
  const options = userOptions as Required<NuxtI18nOptions>

  return {
    options,
    resolver,
    userOptions,
    localeInfo: undefined!,
    localeCodes: undefined!,
    normalizedLocales: undefined!,
    vueI18nConfigPaths: undefined!
  }
}
