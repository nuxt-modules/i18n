import { IncomingMessage } from 'http'
import { Context as NuxtContext } from '@nuxt/types'
import { Route } from 'vue-router'
import { LocaleMessageObject, I18nOptions, Locale, LocaleMessages } from 'vue-i18n'
import Vue from 'vue'
import { DetectBrowserLanguageOptions, VuexOptions, Options, LocaleObject } from '.'

export type LocaleFileExport = ((context: NuxtContext) => LocaleMessageObject) | ({ default: (context: NuxtContext) => LocaleMessageObject }) | LocaleMessageObject
export type onNavigateInternal = (route: Route) => Promise<[number | null, string | null] | [number | null, string | null, boolean | undefined]>

export interface ResolvedOptions extends Omit<Required<Options>, 'detectBrowserLanguage' | 'vueI18n' | 'vuex'> {
  detectBrowserLanguage: Required<DetectBrowserLanguageOptions> | false
  localeCodes: readonly Locale[]
  normalizedLocales: readonly LocaleObject[]
  additionalMessages: LocaleMessages[]
  vueI18n: I18nOptions | ((context: NuxtContext) => Promise<I18nOptions>)
  vuex: Required<VuexOptions> | false
}

export interface PluginProxy {
  getRouteBaseName: Vue['getRouteBaseName']
  i18n: Vue['$i18n'],
  localePath: Vue['localePath'],
  localeRoute: Vue['localeRoute'],
  localeLocation: Vue['localeLocation'],
  req?: IncomingMessage,
  route: Vue['$route'],
  router: Vue['$router'],
  store: Vue['$store']
}

declare module 'vue-i18n' {
  // the VueI18n class expands here: https://goo.gl/Xtp9EG
  // it is necessary for the $i18n property in Vue interface: "readonly $i18n: VueI18n & IVueI18n"
  interface IVueI18n {
    // Internal.
    __baseUrl: string
    __onNavigate: onNavigateInternal
    __pendingLocale: string | null | undefined
    __pendingLocalePromise: Promise<string> | undefined
    __redirect: string | null
    __resolvePendingLocalePromise: (value: string) => void | undefined
  }
}
