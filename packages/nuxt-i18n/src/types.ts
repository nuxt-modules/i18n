import type { Directions, Strategies, LocaleObject, VueI18nRoutingOptions } from 'vue-i18n-routing'
import type { Locale } from '@intlify/vue-i18n-bridge'

// TODO: bring up from @nuxtjs/i18n type definition

export type RedirectOnOptions = 'all' | 'root' | 'no prefix'

export interface LazyOptions {
  skipNuxtState?: boolean
}

export interface DetectBrowserLanguageOptions {
  alwaysRedirect?: boolean
  cookieCrossOrigin?: boolean
  cookieDomain?: string | null
  cookieKey?: string
  cookieSecure?: boolean
  fallbackLocale?: Locale | null
  redirectOn?: RedirectOnOptions
  useCookie?: boolean
}

export interface RootRedirectOptions {
  path: string
  statusCode: number
}

export type NuxtI18nOptions = {
  // differentDomains?: boolean
  // onBeforeLanguageSwitch?: (
  //   oldLocale: string,
  //   newLocale: string,
  //   initialSetup: boolean,
  //   context: NuxtContext
  // ) => string | void
  // onLanguageSwitched?: (oldLocale: string, newLocale: string) => void
  // detectBrowserLanguage?: DetectBrowserLanguageOptions | false
  langDir?: string | null
  lazy?: boolean | LazyOptions
  pages?: {
    [key: string]:
      | false
      | {
          [key: string]: false | string
        }
  }
  // parsePages?: boolean
  // rootRedirect?: string | null | RootRedirectOptions
  // routesNameSeparator?: string
  // skipSettingLocaleOnNavigate?: boolean
  // sortRoutes?: boolean
  // strategy?: Strategies
  // vueI18n?: I18nOptions | string
  // vueI18nLoader?: boolean
  // vuex?: VuexOptions | false
} & Pick<
  VueI18nRoutingOptions,
  | 'baseUrl'
  | 'defaultDirection'
  | 'defaultLocale'
  | 'defaultLocaleRouteNameSuffix'
  | 'locales'
  | 'routesNameSeparator'
  | 'trailingSlash'
>
