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

export type LocaleType = 'static' | 'dynamic' | 'unknown'

export type LocaleInfo = {
  /**
   * NOTE:
   *  The following fields are for `file` in the nuxt i18n module `locales` option
   */
  path?: string // abolute path
  hash?: string
  type?: LocaleType
  /**
   * NOTE:
   *  The following fields are for `files` (excluds nuxt layers) in the nuxt i18n module `locales` option.
   */
  paths?: string[]
  hashes?: string[]
  types?: LocaleType[]
} & LocaleObject

export type VueI18nConfigPathInfo = {
  relative?: string
  absolute?: string
  hash?: string
  type?: LocaleType
  rootDir: string
  relativeBase: string
}

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

export interface LocaleMessageCompilationOptions {
  jit?: boolean
  strictMessage?: boolean
  escapeHtml?: boolean
}

export { I18nOptions }

export type NuxtI18nOptions<Context = unknown> = {
  vueI18n?: string
  experimental?: ExperimentalFeatures
  compilation?: LocaleMessageCompilationOptions
  differentDomains?: boolean
  detectBrowserLanguage?: DetectBrowserLanguageOptions | false
  langDir?: string | null
  lazy?: boolean
  pages?: CustomRoutePages
  customRoutes?: 'page' | 'config'
  /**
   * @internal
   */
  overrides?: Omit<NuxtI18nOptions, 'overrides'>
  i18nModules?: { langDir?: string | null; locales?: I18nRoutingOptions<Context>['locales'] }[]
  rootRedirect?: string | null | RootRedirectOptions
  routesNameSeparator?: string
  skipSettingLocaleOnNavigate?: boolean
  strategy?: Strategies
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
