import type { Strategies, LocaleObject, I18nRoutingOptions } from 'vue-i18n-routing'
import type { Locale, I18nOptions } from '@intlify/vue-i18n-bridge'

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

export type BeforeLanguageSwitchHandler = <Context = unknown>(
  oldLocale: string,
  newLocale: string,
  initialSetup: boolean,
  context: Context
) => string | void

export type LanguageSwitchedHandler = (oldLocale: string, newLocale: string) => void

export type NuxtI18nOptions<Context = unknown> = {
  differentDomains?: boolean
  onBeforeLanguageSwitch?: BeforeLanguageSwitchHandler
  onLanguageSwitched?: LanguageSwitchedHandler
  detectBrowserLanguage?: DetectBrowserLanguageOptions | false
  langDir?: string | null
  lazy?: boolean | LazyOptions
  pages?: CustomRoutePages
  parsePages?: boolean
  rootRedirect?: string | null | RootRedirectOptions
  routesNameSeparator?: string
  skipSettingLocaleOnNavigate?: boolean
  // sortRoutes?: boolean
  strategy?: Strategies
  vueI18n?: I18nOptions | string
  debug?: boolean
  // vueI18nLoader?: boolean
  dynamicRouteParams?: boolean | string
  // vuex?: VuexOptions | false
} & Pick<
  I18nRoutingOptions<Context>,
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
