import type { Strategies, LocaleObject, I18nRoutingOptions } from 'vue-i18n-routing'
import type { Locale, I18nOptions } from 'vue-i18n'

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
  path?: string
  paths?: string[]
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
) => Promise<unknown>

export type LanguageSwitchedHandler = (oldLocale: string, newLocale: string) => Promise<unknown>

export type NuxtI18nOptions<Context = unknown> = {
  differentDomains?: boolean
  detectBrowserLanguage?: DetectBrowserLanguageOptions | false
  langDir?: string | null
  lazy?: boolean | LazyOptions
  pages?: CustomRoutePages
  customRoutes?: 'page' | 'config'
  /**
   * @deprecated `'parsePages' option is deprecated. Please use 'customRoutes' option instead. We will remove it in v8 official release.`
   */
  parsePages?: boolean
  rootRedirect?: string | null | RootRedirectOptions
  routesNameSeparator?: string
  skipSettingLocaleOnNavigate?: boolean
  // sortRoutes?: boolean
  strategy?: Strategies
  vueI18n?: I18nOptions | string
  types?: 'composition' | 'legacy'
  debug?: boolean
  dynamicRouteParams?: boolean
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
