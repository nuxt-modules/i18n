import 'vue'
import 'vuex'
import '@nuxt/types'
import { Location, RawLocation, Route } from 'vue-router'
import VueI18n, { IVueI18n } from 'vue-i18n'
import { MetaInfo } from 'vue-meta'
import { BaseOptions, LocaleObject, Options } from '.'

interface NuxtI18nComponentOptions {
  paths?: {
    [key: string]: string | false
  }
  locales?: Array<string>
  seo?: false
}

interface NuxtI18nHeadOptions {
  /**
   * Adds a `dir` attribute to the HTML element.
   * Default: `true`
   */
  addDirAttribute: boolean
  /**
   * Adds various SEO attributes.
   * Default: `false`
   */
  addSeoAttributes: boolean
}

interface NuxtI18nSeo {
  htmlAttrs?: MetaInfo['htmlAttrs']
  link?: MetaInfo['link']
  meta?: MetaInfo['meta']
}

declare module 'vue-i18n' {
  // the VueI18n class expands here: https://goo.gl/Xtp9EG
  // it is necessary for the $i18n property in Vue interface: "readonly $i18n: VueI18n & IVueI18n"
  interface IVueI18n extends Required<BaseOptions> {
    finalizePendingLocaleChange(): Promise<void>
    getBrowserLocale(): string | undefined
    getLocaleCookie(): string | undefined
    loadedLanguages: string[] | undefined
    localeProperties: LocaleObject
    setLocale(locale: string): Promise<void>
    setLocaleCookie(locale: string): void
    waitForPendingLocaleChange(): Promise<void>
  }
}

interface NuxtI18nApi {
    getRouteBaseName(route?: Route): string
    localePath(route: RawLocation, locale?: string): string
    localeRoute(route: RawLocation, locale?: string): Location | undefined
    switchLocalePath(locale: string): string
}

declare module 'vue/types/vue' {
  interface Vue extends NuxtI18nApi {
    // $i18n is already added by vue-i18n.
    /** @deprecated Use `nuxtI18nHead()` instead. */
    $nuxtI18nHead(options?: NuxtI18nHeadOptions): MetaInfo
    $nuxtI18nSeo(): NuxtI18nSeo
  }
}

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    nuxtI18n?: NuxtI18nComponentOptions | false
  }
}

declare module '@nuxt/types' {
  interface NuxtAppOptions extends NuxtI18nApi {
    i18n: VueI18n & IVueI18n
  }

  interface NuxtConfig {
    i18n?: Options
  }
}

declare module 'vuex/types/index' {
  interface Store<S> extends NuxtI18nApi {
    $i18n: VueI18n & IVueI18n
  }
}
