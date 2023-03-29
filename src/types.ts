import type { Strategies, LocaleObject, I18nRoutingOptions } from 'vue-i18n-routing'
import type { Locale, I18nOptions } from 'vue-i18n'

export type RedirectOnOptions = 'all' | 'root' | 'no prefix'

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

export interface ExperimentalFeatures {
  jsTsFormatResource?: boolean
}

export interface LocaleMessagePrecompileOptions {
  strictMessage?: boolean
  escapeHtml?: boolean
}

export type NuxtI18nOptions<Context = unknown> = {
  experimental?: ExperimentalFeatures
  precompile?: LocaleMessagePrecompileOptions
  differentDomains?: boolean
  detectBrowserLanguage?: DetectBrowserLanguageOptions | false
  langDir?: string | null
  lazy?: boolean
  pages?: CustomRoutePages
  customRoutes?: 'page' | 'config'
  /**
   * @internal
   */
  i18nModules?: { langDir?: string | null; locales?: I18nRoutingOptions<Context>['locales'] }[]
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
