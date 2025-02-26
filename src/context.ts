import type { Resolver } from '@nuxt/kit'
import type { LocaleInfo, LocaleObject, NuxtI18nOptions, VueI18nConfigPathInfo } from './types'
import type { Nuxt } from '@nuxt/schema'
import { createResolver, useLogger } from '@nuxt/kit'
import { NUXT_I18N_MODULE_ID } from './constants'
import createDebug from 'debug'

export interface I18nNuxtContext {
  resolver: Resolver
  logger: ReturnType<(typeof import('@nuxt/kit'))['useLogger']>
  debug: ReturnType<typeof import('debug')>
  userOptions: NuxtI18nOptions
  options: Required<NuxtI18nOptions>
  isDev: boolean
  isSSR: boolean
  isPrepare: boolean
  isSSG: boolean
  isBuild: boolean
  isTest: boolean
  normalizedLocales: LocaleObject<string>[]
  localeCodes: string[]
  localeInfo: LocaleInfo[]
  vueI18nConfigPaths: Required<VueI18nConfigPathInfo>[]
}

const debug = createDebug('@nuxtjs/i18n:context')
const resolver = createResolver(import.meta.url)

export function createContext(userOptions: NuxtI18nOptions, nuxt: Nuxt): I18nNuxtContext {
  const options = userOptions as Required<NuxtI18nOptions>

  return {
    resolver,
    logger: useLogger(NUXT_I18N_MODULE_ID),
    debug,
    userOptions,
    options,
    isDev: nuxt.options.dev,
    isSSR: nuxt.options.ssr,
    isPrepare: nuxt.options._prepare,
    isSSG: nuxt.options._generate,
    isBuild: nuxt.options._build,
    isTest: nuxt.options.test,
    normalizedLocales: undefined!,
    localeCodes: undefined!,
    localeInfo: undefined!,
    vueI18nConfigPaths: undefined!
  }
}
