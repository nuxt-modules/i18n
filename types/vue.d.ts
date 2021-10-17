import Vue from 'vue'
import 'vuex'
import 'vue-i18n'
import '@nuxt/types'
import { Location, RawLocation, Route } from 'vue-router'
import { MetaInfo } from 'vue-meta'
import { Options, NuxtI18nInstance, IVueI18nNuxt } from '.'

interface NuxtI18nComponentOptions {
  paths?: {
    [key: string]: string | false
  }
  locales?: Array<string>
}

interface NuxtI18nHeadOptions {
  /**
   * Adds a `dir` attribute to the HTML element.
   * @default false
   */
  addDirAttribute?: boolean
  /**
   * Adds various SEO attributes.
   * @default false
   */
  addSeoAttributes?: boolean | SeoAttributesOptions
}

interface SeoAttributesOptions {
  /**
   * An array of strings corresponding to query params you would like to include in your canonical URL.
   * @default []
   */
  canonicalQueries?: string[]
}

type NuxtI18nMeta = Required<Pick<MetaInfo, 'htmlAttrs' | 'link' | 'meta'>>

interface NuxtI18nApi {
    getRouteBaseName(route?: Route): string | undefined
    localePath(route: RawLocation, locale?: string): string
    localeRoute(route: RawLocation, locale?: string): Route | undefined
    localeLocation(route: RawLocation, locale?: string): Location | undefined
    switchLocalePath(locale: string): string
}

declare module 'vue-i18n' {
  interface IVueI18n extends IVueI18nNuxt {}
}

declare module 'vue/types/vue' {
  interface Vue extends NuxtI18nApi {
    // $i18n is already added by vue-i18n.
    $nuxtI18nHead(options?: NuxtI18nHeadOptions): NuxtI18nMeta
  }
}

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    nuxtI18n?: NuxtI18nComponentOptions | false
  }
}

declare module '@nuxt/types' {
  interface Context extends NuxtI18nApi {
    i18n: NuxtI18nInstance
  }

  interface NuxtAppOptions extends NuxtI18nApi {
    i18n: NuxtI18nInstance
  }

  interface NuxtConfig {
    i18n?: Options
  }
}

declare module 'vuex/types/index' {
  interface Store<S> extends NuxtI18nApi {
    $i18n: NuxtI18nInstance
  }
}
