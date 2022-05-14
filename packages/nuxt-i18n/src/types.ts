import type { Directions, Strategies, LocaleObject, I18nRoutingOptions, BaseUrlResolveHandler } from 'vue-i18n-routing'
import type { Locale, I18nOptions } from '@intlify/vue-i18n-bridge'

// TODO: bring up from @nuxtjs/i18n type definition

export type NoNullable<T> = Exclude<T, null | undefined>

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

export type LocaleInfo = {
  path: string
} & LocaleObject

export interface RootRedirectOptions {
  path: string
  statusCode: number
}

export type CustomRoutePages = {
  [key: string]:
    | false
    | {
        [key: string]: false | string
      }
}

export type NuxtI18nOptions<BaseUrl extends BaseUrlResolveHandler = BaseUrlResolveHandler> = {
  // differentDomains?: boolean
  // onBeforeLanguageSwitch?: (
  //   oldLocale: string,
  //   newLocale: string,
  //   initialSetup: boolean,
  //   context: NuxtContext
  // ) => string | void
  // onLanguageSwitched?: (oldLocale: string, newLocale: string) => void
  detectBrowserLanguage?: DetectBrowserLanguageOptions
  langDir?: string | null
  lazy?: boolean | LazyOptions
  pages?: CustomRoutePages
  // parsePages?: boolean
  // rootRedirect?: string | null | RootRedirectOptions
  routesNameSeparator?: string
  // skipSettingLocaleOnNavigate?: boolean
  // sortRoutes?: boolean
  // strategy?: Strategies
  vueI18n?: I18nOptions | string
  // vueI18nLoader?: boolean
  // vuex?: VuexOptions | false
} & Pick<
  I18nRoutingOptions<BaseUrl>,
  | 'baseUrl'
  | 'strategy'
  | 'defaultDirection'
  | 'defaultLocale'
  | 'defaultLocaleRouteNameSuffix'
  | 'locales'
  | 'routesNameSeparator'
  | 'trailingSlash'
>

export type NuxtI18nInternalOptions = {
  __normalizedLocales?: LocaleObject[]
}
