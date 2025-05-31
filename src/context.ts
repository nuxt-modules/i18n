import { createResolver } from '@nuxt/kit'
import { fileURLToPath } from 'node:url'
import { dirname } from 'pathe'
import type { Resolver } from '@nuxt/kit'
import type { FileMeta, LocaleInfo, LocaleObject, NuxtI18nOptions } from './types'

export interface I18nNuxtContext {
  resolver: Resolver
  userOptions: NuxtI18nOptions
  options: Required<NuxtI18nOptions>
  normalizedLocales: LocaleObject<string>[]
  localeCodes: string[]
  localeInfo: LocaleInfo[]
  vueI18nConfigPaths: FileMeta[]
  distDir: string
  runtimeDir: string
  fullStatic: boolean
  i18nModules: { langDir: string; locales: string[] | LocaleObject[] }[]
}

const resolver = createResolver(import.meta.url)
const distDir = dirname(fileURLToPath(import.meta.url))
const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

export function createContext(userOptions: NuxtI18nOptions): I18nNuxtContext {
  const options = userOptions as Required<NuxtI18nOptions>

  return {
    options,
    resolver,
    userOptions,
    distDir,
    runtimeDir,
    localeInfo: undefined!,
    localeCodes: undefined!,
    normalizedLocales: undefined!,
    vueI18nConfigPaths: undefined!,
    fullStatic: undefined!,
    i18nModules: []
  }
}
