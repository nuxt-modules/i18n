import Vue from "vue";
import { RawLocation } from "vue-router";
import VueI18n, { IVueI18n } from "vue-i18n";
import { MetaInfo } from 'vue-meta'

/**
 * The nuxt-i18n types namespace
 */
declare namespace NuxtVueI18n {
  type Locale = VueI18n.Locale

  namespace Options {
    // e.g.:
    // [
    //   { code: 'en', iso: 'en-US', file: 'en.js' },
    //   { code: 'fr', iso: 'fr-FR', file: 'fr.js' },
    //   { code: 'es', iso: 'es-ES', file: 'es.js' }
    // ]
    interface LocaleObject {
      code: Locale
      // can be undefined: https://goo.gl/cCGKUV
      iso?: string
      // can be undefined: https://goo.gl/ryc5pF
      file?: string
      // Allow custom properties, e.g. "name": https://goo.gl/wrcb2G
      [key: string]: any
    }

    interface DetectBrowserLanguageInterface {
      useCookie?: boolean
      cookieKey?: string
      alwaysRedirect?: boolean
      fallbackLocale?: Locale | null
    }

    interface VuexInterface {
      moduleName?: string
      syncLocale?: boolean
      syncMessages?: boolean
      syncRouteParams?: boolean
    }

    // options that are also exposed on VueI18n instance: https://goo.gl/UwNfZo
    interface NuxtI18nInterface {
      beforeLanguageSwitch?: () => any
      defaultLocale?: null | Locale
      locales?: Array<Locale | LocaleObject>
      differentDomains?: boolean
      forwardedHost?: boolean
      onLanguageSwitched?: () => any
    }

    // see options reference: https://github.com/nuxt-community/nuxt-i18n/blob/master/docs/options-reference.md
    interface AllOptionsInterface extends NuxtI18nInterface {
      baseUrl?: string
      detectBrowserLanguage?: DetectBrowserLanguageInterface
      encodePaths?: boolean
      langDir?: string | null
      lazy?: boolean
      // see https://goo.gl/NbzX3f
      pages?: {
        [key: string]: boolean | {
          [key: string]: boolean | string
        }
      }
      parsePages?: boolean
      rootRedirect?: string | null
      routesNameSeparator?: string
      seo?: boolean
      strategy?: "no_prefix" | "prefix_except_default" | "prefix" | "prefix_and_default"
      vueI18n?: VueI18n.I18nOptions
      vuex?: VuexInterface
    }
  }
}

export interface NuxtI18nSeo {
  htmlAttrs?: MetaInfo['htmlAttrs']
  link?: MetaInfo['link']
  meta?: MetaInfo['meta']
}

/**
 * Extends types in vue
 */
declare module "vue/types/vue" {
  interface Vue {
    localePath(route: RawLocation, locale?: string): string;
    switchLocalePath(locale: string): string;
    getRouteBaseName(route: RawLocation): string;
    $nuxtI18nSeo(): NuxtI18nSeo;
    // PHPStorm without this indicates that "$i18n" was not found.
    readonly $i18n: VueI18n & IVueI18n;
  }
}

/**
 * Extends types in vue-i18n
 */
declare module "vue-i18n" {
  // the VueI18n class expands here: https://goo.gl/Xtp9EG
  // it is necessary for the $i18n property in Vue interface: "readonly $i18n: VueI18n & IVueI18n"
  interface IVueI18n extends NuxtVueI18n.Options.NuxtI18nInterface {
    getLocaleCookie: () => string | undefined
    setLocaleCookie: (locale: string) => undefined
    setLocale: (locale: string) => Promise<undefined>
  }
}

/**
 * Extends types in Nuxt
 */
declare module '@nuxt/types/app' {
  interface NuxtAppOptions extends NuxtVueI18n.Options.NuxtI18nInterface {
    readonly i18n: VueI18n & IVueI18n
  }
}
