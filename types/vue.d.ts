import Vue from "vue";
import { RawLocation } from "vue-router";
import VueI18n, { IVueI18n } from "vue-i18n";

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
      useCookie: boolean
      cookieKey: string
      alwaysRedirect: boolean
      fallbackLocale: Locale | null
    }

    interface Vuex {
      moduleName: string
      mutations: {
        setLocale: string
        setMessages: string
      }
      preserveState: boolean
    }

    // special options for a "app.i18n" property: https://goo.gl/UwNfZo
    interface VueI18nInterface {
      locales: Array<Locale | LocaleObject>
      defaultLocale: null | Locale
      differentDomains: boolean
      forwardedHost: boolean
      routesNameSeparator: string
      beforeLanguageSwitch: () => any
      onLanguageSwitched: () => any
      setLocaleCookie: (locale: string) => undefined
    }

    // see options reference: https://github.com/nuxt-community/nuxt-i18n/blob/master/docs/options-reference.md
    interface AllOptionsInterface extends VueI18nInterface {
      vueI18n: VueI18n.I18nOptions
      strategy: "prefix_except_default" | "prefix" | "prefix_and_default"
      lazy: boolean
      langDir: string | null
      rootRedirect: string | null
      detectBrowserLanguage: Options.DetectBrowserLanguageInterface
      seo: false
      baseUrl: string
      vuex: Options.Vuex
      parsePages: boolean
      // see https://goo.gl/NbzX3f
      pages: {
        [key: string]: boolean | {
          [key: string]: boolean | string
        }
      }
      encodePaths: boolean
    }
  }
}

interface NuxtI18nSeo {
  htmlAttrs?: {
    lang?: string
  }
  link?: {
    hid: string,
    rel: string,
    href: string,
    hreflang: string
  }[]
  meta?: {
    hid: string,
    name: string,
    property: string,
    content: string
  }[]
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
  interface IVueI18n extends NuxtVueI18n.Options.VueI18nInterface {

  }
}
