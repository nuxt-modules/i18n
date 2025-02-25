import type { Locale, I18nOptions } from 'vue-i18n'
import type { PluginOptions } from '@intlify/unplugin-vue-i18n'
import type { NuxtPage } from '@nuxt/schema'
import type { RouteMapGeneric, RouteMapI18n } from 'vue-router'
import { STRATEGIES } from './constants'
export type {
  STRATEGY_NO_PREFIX,
  STRATEGY_PREFIX,
  STRATEGY_PREFIX_AND_DEFAULT,
  STRATEGY_PREFIX_EXCEPT_DEFAULT,
  STRATEGIES
} from './constants'

// Options
// export const STRATEGY_PREFIX = 'prefix'
// export const STRATEGY_PREFIX_EXCEPT_DEFAULT = 'prefix_except_default'
// export const STRATEGY_PREFIX_AND_DEFAULT = 'prefix_and_default'
// export const STRATEGY_NO_PREFIX = 'no_prefix'
// export const STRATEGIES = {
//   PREFIX: STRATEGY_PREFIX,
//   PREFIX_EXCEPT_DEFAULT: STRATEGY_PREFIX_EXCEPT_DEFAULT,
//   PREFIX_AND_DEFAULT: STRATEGY_PREFIX_AND_DEFAULT,
//   NO_PREFIX: STRATEGY_NO_PREFIX
// } as const

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
} & Omit<LocaleObject, 'file' | 'files'> & {
    code: Locale
    files: LocaleFile[]
    meta?: (FileMeta & { file: LocaleFile })[]
  }

export type FileMeta = {
  path: string
  loadPath: string
  hash: string
  type: LocaleType
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

type RouteLocationAsStringTypedListI18n<T = RouteMapGeneric extends RouteMapI18n ? RouteMapGeneric : RouteMapI18n> = {
  [N in keyof T]?: Partial<Record<Locale, `/${string}` | false>> | false
}
export type CustomRoutePages = RouteLocationAsStringTypedListI18n

export interface ExperimentalFeatures {
  localeDetector?: string
  switchLocalePathLinkSSR?: boolean
  /**
   * Automatically imports/initializes `$t`, `$rt`, `$d`, `$n`, `$tm` and `$te` functions in `<script setup>` when used.
   *
   * @defaultValue `false`
   */
  autoImportTranslationFunctions?: boolean

  /**
   * Generates types for i18n routing helper
   *
   * @defaultValue `true`
   */
  typedPages?: boolean

  /**
   * Generates types for vue-i18n and messages
   *
   * @defaultValue `false`
   *
   * @remark `'default'` to generate types based on `defaultLocale`
   * @remark `'all'` to generate types based on all locales
   */
  typedOptionsAndMessages?: false | 'default' | 'all'

  /**
   * Locale file and langDir paths can be formatted differently to prevent exposing sensitive paths in production.
   *
   * @defaultValue `'absolute'`
   *
   * @remark `'absolute'` locale file and langDir paths contain the full absolute path
   * @remark `'relative'` locale file and langDir paths are converted to be relative to the `rootDir`
   */
  generatedLocaleFilePathFormat?: 'absolute' | 'relative'

  /**
   * Removes non-canonical query parameters from alternate link meta tags
   *
   * @defaultValue `false`
   */
  alternateLinkCanonicalQueries?: boolean

  /**
   * Hot module replacement for locale message files and vue-i18n configuration in dev mode.
   *
   * @defaultValue `true`
   */
  hmr?: boolean
}

export interface BundleOptions
  extends Pick<
    PluginOptions,
    | 'compositionOnly'
    | 'runtimeOnly'
    | 'fullInstall'
    | 'dropMessageCompiler'
    | 'onlyLocales'
    | 'optimizeTranslationDirective'
  > {}

export interface CustomBlocksOptions extends Pick<PluginOptions, 'defaultSFCLang' | 'globalSFCScope'> {}

export interface LocaleMessageCompilationOptions {
  strictMessage?: boolean
  escapeHtml?: boolean
}

export type NuxtI18nOptions<
  Context = unknown,
  ConfiguredLocaleType extends string[] | LocaleObject[] = string[] | LocaleObject[]
> = {
  /**
   * Path to a Vue I18n configuration file, the module will scan for a i18n.config{.js,.mjs,.ts} if left unset.
   *
   * @defaultValue `''` (empty string)
   */
  vueI18n?: string
  experimental?: ExperimentalFeatures
  /**
   * The directory to resolve i18n files from, the restructure can be disabled by setting this to `false`.
   *
   * @defaultValue `'i18n'`
   */
  restructureDir?: string | false
  bundle?: BundleOptions
  compilation?: LocaleMessageCompilationOptions
  customBlocks?: CustomBlocksOptions
  /**
   * Enable when using different domains for each locale
   *
   * @remarks
   * If enabled, no prefix is added to routes
   * and `locales` must be configured as an array of `LocaleObject` objects with the `domain` property set.
   *
   * @defaultValue `false`
   */
  differentDomains?: boolean
  /**
   * Enable when using different domains with different locales
   *
   * @remarks
   * If enabled, `locales` must be configured as an array of `LocaleObject` objects with the `domains` and `defaultForDomains` property set.
   *
   * @defaultValue `false`
   */
  multiDomainLocales?: boolean
  detectBrowserLanguage?: DetectBrowserLanguageOptions | false
  langDir?: string | null
  lazy?: boolean
  pages?: CustomRoutePages
  customRoutes?: 'page' | 'config'
  /**
   * @internal
   * Do not use in projects - this is used internally for e2e tests to override default option merging.
   */
  overrides?: Omit<NuxtI18nOptions<Context>, 'overrides'>
  /**
   * @internal
   * Do not use in projects
   */
  i18nModules?: { langDir?: string | null; locales?: NuxtI18nOptions<Context>['locales'] }[]
  rootRedirect?: string | RootRedirectOptions
  skipSettingLocaleOnNavigate?: boolean
  types?: 'composition' | 'legacy'
  debug?: boolean | 'verbose'
  parallelPlugin?: boolean
  /**
   * The app's default locale
   *
   * @remarks
   * When using `prefix_except_default` strategy, URLs for locale specified here won't have a prefix.
   *
   * It's recommended to set this to some locale regardless of chosen strategy, as it will be used as a fallback locale when navigating to a non-existent route
   *
   * @defaultValue '' (empty string)
   */
  defaultLocale?: Locale
  /**
   * List of locales supported by your app
   *
   * @remarks
   * Can either be an array of string codes (e.g. `['en', 'fr']`) or an array of {@link LocaleObject} for more complex configurations
   *
   * @defaultValue []
   */
  locales?: ConfiguredLocaleType
  /**
   * Routes strategy
   *
   * @remarks
   * Can be set to one of the following:
   *
   * - `no_prefix`: routes won't have a locale prefix
   * - `prefix_except_default`: locale prefix added for every locale except default
   * - `prefix`: locale prefix added for every locale
   * - `prefix_and_default`: locale prefix added for every locale and default
   *
   * @defaultValue 'prefix_except_default'
   */
  strategy?: Strategies
  /**
   * Whether to use trailing slash
   *
   * @defaultValue false
   */
  trailingSlash?: boolean
  /**
   * Internal separator used for generated route names for each locale. You shouldn't need to change this
   *
   * @defaultValue '___'
   */
  routesNameSeparator?: string
  /**
   * Internal suffix added to generated route names for default locale
   *
   * @remarks
   * if strategy is prefix_and_default. You shouldn't need to change this.
   *
   * @defaultValue 'default'
   */
  defaultLocaleRouteNameSuffix?: string
  /**
   * Default direction direction
   *
   * @defaultValue 'ltr'
   */
  defaultDirection?: Directions
  /**
   * The fallback base URL to use as a prefix for alternate URLs in hreflang tags.
   *
   * @remarks
   * By default VueRouter's base URL will be used and only if that is not available, fallback URL will be used.
   *
   * Can also be a function (will be passed a Nuxt Context as a parameter) that returns a string.
   *
   * Useful to make base URL dynamic based on request headers.
   *
   * @defaultValue ''
   */
  baseUrl?: string | BaseUrlResolveHandler<Context>
}

export type VueI18nConfig = () => Promise<{ default: I18nOptions | (() => I18nOptions | Promise<I18nOptions>) }>

/**
 * Routing strategy
 *
 * @public
 */
export type Strategies = (typeof STRATEGIES)[keyof typeof STRATEGIES]

/**
 * Direction
 *
 * @public
 */
export type Directions = 'ltr' | 'rtl' | 'auto'

/**
 * Locale object
 *
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface LocaleObject<T = Locale> extends Record<string, any> {
  code: T
  name?: string
  dir?: Directions
  domain?: string
  domains?: string[]
  defaultForDomains?: string[]
  file?: string | LocaleFile
  files?: string[] | LocaleFile[]
  isCatchallLocale?: boolean
  language?: string
}

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BaseUrlResolveHandler<Context = any> = (context: Context) => string

/**
 * Options to compute route localizing
 *
 * @remarks
 * The route options that is compute the route to be localized on {@link localizeRoutes}
 *
 * @public
 */
export interface ComputedRouteOptions {
  locales: readonly Locale[]
  paths: Record<Locale, string>
}

/**
 * Resolver for route localizing options
 *
 * @public
 */
export type RouteOptionsResolver = (route: NuxtPage, localeCodes: Locale[]) => ComputedRouteOptions | undefined

/**
 * Localize route path prefix judgment options used in {@link LocalizeRoutesPrefixable}
 *
 * @public
 */
export interface PrefixLocalizedRouteOptions {
  /**
   * Current locale
   */
  locale: Locale
  /**
   * Default locale
   */
  defaultLocale?: Locale | undefined
  /**
   * The parent route of the route to be resolved
   */
  parent: NuxtPage | undefined
  /**
   * The path of route
   */
  path: string
}

/**
 * SEO Attribute options.
 *
 * @public
 */
export interface SeoAttributesOptions {
  /**
   * An array of strings corresponding to query params you would like to include in your canonical URL.
   *
   * @defaultValue []
   */
  canonicalQueries?: string[]
}

/**
 * Options for {@link localeHead} function.
 *
 * @public
 */
export interface I18nHeadOptions {
  /**
   * Adds a `lang` attribute to the HTML element.
   *
   * @defaultValue true
   */
  lang?: boolean
  /**
   * Adds a `dir` attribute to the HTML element.
   *
   * @defaultValue true
   */
  dir?: boolean
  /**
   * Adds various SEO tags.
   *
   * @defaultValue true
   */
  seo?: boolean | SeoAttributesOptions
  /**
   * Identifier attribute of `<meta>` tag
   *
   * @defaultValue 'hid'
   */
  key?: string
}

/**
 * Meta attributes for head properties.
 *
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MetaAttrs = Record<string, any>

/**
 * I18n header meta info.
 *
 * @public
 */
export interface I18nHeadMetaInfo {
  htmlAttrs?: MetaAttrs
  meta?: MetaAttrs[]
  link?: MetaAttrs[]
}

/**
 * Route path prefix judgment options used in {@link Prefixable}
 */
export type PrefixableOptions = {
  /**
   * Current locale
   */
  currentLocale: Locale
  /**
   * Default locale
   */
  defaultLocale: Locale
  /**
   * Curernt strategy
   */
  strategy: Strategies
}

/**
 * The intercept handler which is called in {@link switchLocalePath} function
 */
export type SwitchLocalePathIntercepter = (path: string, locale: Locale) => string

export interface I18nPublicRuntimeConfig {
  baseUrl: NuxtI18nOptions['baseUrl']
  rootRedirect: NuxtI18nOptions['rootRedirect']
  multiDomainLocales?: NuxtI18nOptions['multiDomainLocales']

  /**
   * Overwritten at build time, used to pass generated options to runtime
   *
   * @internal
   */
  domainLocales: { [key: Locale]: { domain: string | undefined } }

  /**
   * Overwritten at build time, used to pass generated options to runtime
   *
   * @internal
   */
  experimental: NonNullable<NuxtI18nOptions['experimental']>
  /**
   * Overwritten at build time, used to pass generated options to runtime
   *
   * @internal
   */
  locales: NonNullable<Required<NuxtI18nOptions<unknown>>['locales']>
  /**
   * Overwritten at build time, used to pass generated options to runtime
   *
   * @internal
   */
  differentDomains: Required<NuxtI18nOptions>['differentDomains']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   *
   * @internal
   */
  skipSettingLocaleOnNavigate: Required<NuxtI18nOptions>['skipSettingLocaleOnNavigate']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   *
   * @internal
   */
  defaultLocale: Required<NuxtI18nOptions>['defaultLocale']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   *
   * @internal
   */
  lazy: Required<NuxtI18nOptions>['lazy']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   *
   * @internal
   */
  defaultDirection: Required<NuxtI18nOptions>['defaultDirection']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   *
   * @internal
   */
  detectBrowserLanguage: Required<NuxtI18nOptions>['detectBrowserLanguage']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   *
   * @internal
   */
  strategy: Required<NuxtI18nOptions>['strategy']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   *
   * @internal
   */
  routesNameSeparator: Required<NuxtI18nOptions>['routesNameSeparator']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   *
   * @internal
   */
  defaultLocaleRouteNameSuffix: Required<NuxtI18nOptions>['defaultLocaleRouteNameSuffix']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   *
   * @internal
   */
  trailingSlash: Required<NuxtI18nOptions>['trailingSlash']
}
