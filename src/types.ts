import type { Strategies, I18nRoutingOptions, LocaleObject } from 'vue-i18n-routing'
import type { Locale, I18nOptions } from 'vue-i18n'
import type { PluginOptions } from '@intlify/unplugin-vue-i18n'
import type { ParsedPath } from 'path'

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

export type LocaleFile = { path: string; cache?: boolean }

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
   *  The following fields are for `files` (excludes nuxt layers) in the nuxt i18n module `locales` option.
   */
  paths?: string[]
  hashes?: string[]
  types?: LocaleType[]
} & Omit<LocaleObject, 'file' | 'files'> & { files: LocaleFile[]; meta?: (FileMeta & { file: LocaleFile })[] }

export type FileMeta = {
  path: string
  loadPath: string
  hash: string
  type: LocaleType
  parsed: ParsedPath
  key: string
}

export type VueI18nConfigPathInfo = {
  relative?: string
  absolute?: string
  hash?: string
  type?: LocaleType
  rootDir: string
  relativeBase: string
  meta: FileMeta
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
  localeDetector?: string
}

export interface BundleOptions
  extends Pick<
    PluginOptions,
    'compositionOnly' | 'runtimeOnly' | 'fullInstall' | 'dropMessageCompiler' | 'onlyLocales'
  > {}

export interface CustomBlocksOptions extends Pick<PluginOptions, 'defaultSFCLang' | 'globalSFCScope'> {}

export interface LocaleMessageCompilationOptions {
  jit?: boolean
  strictMessage?: boolean
  escapeHtml?: boolean
}

export type NuxtI18nOptions<Context = unknown> = {
  vueI18n?: string
  experimental?: ExperimentalFeatures
  bundle?: BundleOptions
  compilation?: LocaleMessageCompilationOptions
  customBlocks?: CustomBlocksOptions
  differentDomains?: boolean
  detectBrowserLanguage?: DetectBrowserLanguageOptions | false
  langDir?: string | null
  lazy?: boolean
  pages?: CustomRoutePages
  customRoutes?: 'page' | 'config' | 'named-config'
  /**
   * @internal
   */
  overrides?: Omit<NuxtI18nOptions<Context>, 'overrides'>
  i18nModules?: { langDir?: string | null; locales?: NuxtI18nOptions<Context>['locales'] }[]
  rootRedirect?: string | null | RootRedirectOptions
  routesNameSeparator?: string
  skipSettingLocaleOnNavigate?: boolean
  strategy?: Strategies
  types?: 'composition' | 'legacy'
  debug?: boolean
  dynamicRouteParams?: boolean
  parallelPlugin?: boolean
} & Pick<
  I18nRoutingOptions<Context>,
  | 'baseUrl'
  | 'strategy'
  | 'defaultDirection'
  | 'defaultLocale'
  | 'locales'
  | 'defaultLocaleRouteNameSuffix'
  | 'routesNameSeparator'
  | 'trailingSlash'
>

export type NuxtI18nInternalOptions = {
  __normalizedLocales?: LocaleObject[]
}

export type VueI18nConfig = () => Promise<{ default: I18nOptions | (() => I18nOptions | Promise<I18nOptions>) }>
