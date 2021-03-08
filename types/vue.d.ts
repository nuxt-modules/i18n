import 'vue'
import 'vuex'
import { Location, RawLocation, Route } from 'vue-router'
import VueI18n, { IVueI18n } from 'vue-i18n'
import { MetaInfo } from 'vue-meta'
import { NuxtI18nComponentOptions, NuxtVueI18n, NuxtI18nSeo, NuxtI18nHeadOptions } from './nuxt-i18n'

/**
 * Extends types in vue-i18n
 */
declare module 'vue-i18n' {
  // the VueI18n class expands here: https://goo.gl/Xtp9EG
  // it is necessary for the $i18n property in Vue interface: "readonly $i18n: VueI18n & IVueI18n"
  interface IVueI18n extends NuxtVueI18n.Options.NuxtI18nInterface {
    localeProperties: NuxtVueI18n.Options.LocaleObject
    getLocaleCookie(): string | undefined
    setLocaleCookie(locale: string): undefined
    setLocale(locale: string): Promise<undefined>
    getBrowserLocale(): string | undefined
    finalizePendingLocaleChange(): Promise<void>
    waitForPendingLocaleChange(): Promise<void>
  }
}

/**
 * Extends types in vue
 */
declare module 'vue/types/vue' {
  interface Vue {
    readonly $i18n: VueI18n & IVueI18n
    /** @deprecated */
    $nuxtI18nSeo(): NuxtI18nSeo
    $nuxtI18nHead(options?: NuxtI18nHeadOptions): MetaInfo
    getRouteBaseName(route?: Route): string
    localePath(route: RawLocation, locale?: string): string
    localeRoute(route: RawLocation, locale?: string): Location | undefined
    switchLocalePath(locale: string): string
  }
}

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    nuxtI18n?: NuxtI18nComponentOptions | false
  }
}

/**
 * Extends types in Nuxt
 */
declare module '@nuxt/types' {
  interface NuxtAppOptions extends NuxtVueI18n.Options.NuxtI18nInterface {
    readonly i18n: VueI18n & IVueI18n
    getRouteBaseName(route?: Route): string
    localePath(route: RawLocation, locale?: string): string
    localeRoute(route: RawLocation, locale?: string): Location | undefined
    switchLocalePath(locale: string): string
  }

  interface NuxtOptions {
    i18n?: NuxtVueI18n.Options.AllOptionsInterface
  }
}

declare module 'vuex/types/index' {
  interface Store<S> {
    readonly $i18n: VueI18n & IVueI18n
    getRouteBaseName(route?: Route): string
    localePath(route: RawLocation, locale?: string): string
    localeRoute(route: RawLocation, locale?: string): Location | undefined
    switchLocalePath(locale: string): string
  }
}
