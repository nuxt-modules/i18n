import type { Locale, I18nOptions } from 'vue-i18n'
import type { PluginOptions } from '@intlify/unplugin-vue-i18n'
import type { RouteMapGeneric, RouteMapI18n } from 'vue-router'
import { STRATEGIES } from './constants'
export type {
  STRATEGY_NO_PREFIX,
  STRATEGY_PREFIX,
  STRATEGY_PREFIX_AND_DEFAULT,
  STRATEGY_PREFIX_EXCEPT_DEFAULT,
  STRATEGIES
} from './constants'

/**
 * @public
 */
export type RedirectOnOptions = 'all' | 'root' | 'no prefix'

/**
 * @public
 */
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

/**
 * @internal
 */
export type LocaleType = 'static' | 'dynamic' | 'unknown'

export type LocaleFile = { path: string; cache?: boolean }

export type LocaleInfo = Omit<LocaleObject, 'file' | 'files'> & {
  code: Locale
  meta: (FileMeta & { file: LocaleFile })[]
}

/**
 * @internal
 */
export type FileMeta = {
  path: string
  loadPath: string
  hash: string
  type: LocaleType
}

/**
 * @internal
 */
export type VueI18nConfigPathInfo = {
  rootDir: string
  meta: FileMeta
}

/**
 * @public
 */
export interface RootRedirectOptions {
  path: string
  statusCode: number
}

type RouteLocationAsStringTypedListI18n<T = RouteMapGeneric extends RouteMapI18n ? RouteMapGeneric : RouteMapI18n> = {
  [N in keyof T]?: Partial<Record<Locale, `/${string}` | false>> | false
}
export type CustomRoutePages = RouteLocationAsStringTypedListI18n

export interface ExperimentalFeatures {
  /**
   * Path to server-side locale detector resolved from `restructureDir` (`<rootDir>/i18n` by default)
   * @default undefined
   */
  localeDetector?: string
  /**
   * Updates links rendered using `<SwitchLocalePath>` before server response, necessary for dynamic i18n params.
   * @default false
   */
  switchLocalePathLinkSSR?: boolean
  /**
   * Automatically imports/initializes `$t`, `$rt`, `$d`, `$n`, `$tm` and `$te` functions in `<script setup>` when used.
   * @default false
   */
  autoImportTranslationFunctions?: boolean
  /**
   * Generates types for i18n routing helper
   * @default true
   */
  typedPages?: boolean
  /**
   * Generates types for vue-i18n and messages
   * - `'default'` to generate types based on `defaultLocale`
   * - `'all'` to generate types based on all locales
   * @default false
   */
  typedOptionsAndMessages?: false | 'default' | 'all'
  /**
   * Locale file and langDir paths can be formatted differently to prevent exposing sensitive paths in production.
   * - `'absolute'` locale file and langDir paths contain the full absolute path
   * - `'relative'` locale file and langDir paths are converted to be relative to the `rootDir`
   * @default 'absolute'
   */
  generatedLocaleFilePathFormat?: 'absolute' | 'relative' | 'off'
  /**
   * Removes non-canonical query parameters from alternate link meta tags
   * @default false
   */
  alternateLinkCanonicalQueries?: boolean
  /**
   * Hot module replacement for locale message files and vue-i18n configuration in dev mode.
   * @default true
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
   * @default ''
   */
  vueI18n?: string
  experimental?: ExperimentalFeatures
  /**
   * The directory to resolve i18n files from, the restructure can be disabled by setting this to `false`.
   * @default 'i18n'
   */
  restructureDir?: string | false
  bundle?: BundleOptions
  compilation?: LocaleMessageCompilationOptions
  customBlocks?: CustomBlocksOptions
  /**
   * Enable when using different domains for each locale
   *
   * If enabled, no prefix is added to routes and `locales` must be configured as an array of `LocaleObject` objects with the `domain` property set.
   * @default false
   */
  differentDomains?: boolean
  /**
   * Enable when using different domains with different locales
   *
   * If enabled, `locales` must be configured as an array of `LocaleObject` objects with the `domains` and `defaultForDomains` property set.
   * @default false
   */
  multiDomainLocales?: boolean
  detectBrowserLanguage?: DetectBrowserLanguageOptions | false
  langDir?: string | null
  lazy?: boolean
  pages?: CustomRoutePages
  customRoutes?: 'page' | 'config'
  /**
   * Do not use in projects - this is used internally for e2e tests to override default option merging.
   * @internal
   */
  overrides?: Omit<NuxtI18nOptions<Context>, 'overrides'>
  /**
   * Do not use in projects - this is used internally for e2e tests to override default option merging.
   * @internal
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
   * It's recommended to set this to some locale regardless of chosen strategy, as it will be used as a fallback locale when navigating to a non-existent route
   *
   * With `prefix_except_default` strategy, routes for `defaultLocale` have no prefix.
   * @default ''
   */
  defaultLocale?: Locale
  /**
   * List of locales supported by your app
   *
   * Can either be an array of string codes (e.g. `['en', 'fr']`) or an array of {@link LocaleObject} for more complex configurations
   * @default []
   */
  locales?: ConfiguredLocaleType
  /**
   * Routes strategy
   * - `no_prefix`: routes won't have a locale prefix
   * - `prefix_except_default`: locale prefix added for every locale except default
   * - `prefix`: locale prefix added for every locale
   * - `prefix_and_default`: locale prefix added for every locale and default
   *
   * @default 'prefix_except_default'
   */
  strategy?: Strategies
  /**
   * Whether to use trailing slash
   * @default false
   */
  trailingSlash?: boolean
  /**
   * Internal separator used for generated route names for each locale - you shouldn't need to change this
   * @default '___'
   */
  routesNameSeparator?: string
  /**
   * Internal suffix added to generated route names for default locale
   *
   * Relevant if strategy is `prefix_and_default` - you shouldn't need to change this.
   * @default 'default'
   */
  defaultLocaleRouteNameSuffix?: string
  /**
   * Default direction direction
   * @default 'ltr'
   */
  defaultDirection?: Directions
  /**
   * The fallback base URL to use as a prefix for alternate URLs in hreflang tags.
   *
   * By default VueRouter's base URL will be used and only if that is not available, fallback URL will be used.
   *
   * Can also be a function (will be passed a Nuxt Context as a parameter) that returns a string.
   *
   * Useful to make base URL dynamic based on request headers.
   *
   * @default ''
   */
  baseUrl?: string | BaseUrlResolveHandler<Context>
}

export type VueI18nConfig = () => Promise<{ default: I18nOptions | (() => I18nOptions | Promise<I18nOptions>) }>

/**
 * Routing strategy
 * @public
 */
export type Strategies = (typeof STRATEGIES)[keyof typeof STRATEGIES]

/**
 * Direction
 * @public
 */
export type Directions = 'ltr' | 'rtl' | 'auto'

/**
 * Locale object
 * @public
 */
export interface LocaleObject<T = Locale> {
  [k: string]: unknown
  /** Code used for route prefixing and argument in i18n utility functions. */
  code: T
  /** User facing name */
  name?: string
  /** Writing direction */
  dir?: Directions
  /** Language tag - see IETF's BCP47 - required when using SEO features */
  language?: string
  /** Override default SEO catch-all and force this locale to be catch-all for its locale group */
  isCatchallLocale?: boolean
  domain?: string
  domains?: string[]
  defaultForDomains?: string[]
  domainDefault?: boolean
  file?: string | LocaleFile
  files?: string[] | LocaleFile[]
}

/**
 * @public
 */
export type BaseUrlResolveHandler<Context = unknown> = (context: Context) => string

/**
 * SEO Attribute options.
 * @public
 */
export interface SeoAttributesOptions {
  /**
   * An array of strings corresponding to query params you would like to include in your canonical URL.
   * @default []
   */
  canonicalQueries?: string[]
}

/**
 * @public Options for {@link localeHead} function.
 */
export interface I18nHeadOptions {
  /**
   * Adds a `lang` attribute to the HTML element.
   * @default true
   */
  lang?: boolean
  /**
   * Adds a `dir` attribute to the HTML element.
   * @default true
   */
  dir?: boolean
  /**
   * Adds various SEO tags.
   * @default true
   */
  seo?: boolean | SeoAttributesOptions
  /**
   * Identifier attribute of `<meta>` tag
   * @default 'hid'
   */
  key?: string
}

/**
 * Meta attributes for head properties.
 * @public
 */
export type MetaAttrs = Record<string, string>

/**
 * I18n header meta info.
 * @public
 */
export interface I18nHeadMetaInfo {
  htmlAttrs: MetaAttrs
  meta: MetaAttrs[]
  link: MetaAttrs[]
}

export interface I18nPublicRuntimeConfig {
  baseUrl: NuxtI18nOptions['baseUrl']
  rootRedirect: NuxtI18nOptions['rootRedirect']
  multiDomainLocales?: NuxtI18nOptions['multiDomainLocales']

  /**
   * Overwritten at build time, used to pass generated options to runtime
   * @internal
   */
  domainLocales: { [key: Locale]: { domain: string | undefined } }
  /**
   * Overwritten at build time, used to pass generated options to runtime
   * @internal
   */
  experimental: NonNullable<NuxtI18nOptions['experimental']>
  /**
   * Overwritten at build time, used to pass generated options to runtime
   * @internal
   */
  locales: NonNullable<Required<NuxtI18nOptions<unknown>>['locales']>
  /**
   * Overwritten at build time, used to pass generated options to runtime
   * @internal
   */
  differentDomains: Required<NuxtI18nOptions>['differentDomains']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   * @internal
   */
  skipSettingLocaleOnNavigate: Required<NuxtI18nOptions>['skipSettingLocaleOnNavigate']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   * @internal
   */
  defaultLocale: Required<NuxtI18nOptions>['defaultLocale']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   * @internal
   */
  lazy: Required<NuxtI18nOptions>['lazy']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   * @internal
   */
  defaultDirection: Required<NuxtI18nOptions>['defaultDirection']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   * @internal
   */
  detectBrowserLanguage: Required<NuxtI18nOptions>['detectBrowserLanguage']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   * @internal
   */
  strategy: Required<NuxtI18nOptions>['strategy']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   * @internal
   */
  routesNameSeparator: Required<NuxtI18nOptions>['routesNameSeparator']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   * @internal
   */
  defaultLocaleRouteNameSuffix: Required<NuxtI18nOptions>['defaultLocaleRouteNameSuffix']
  /**
   * Overwritten at build time, used to pass generated options to runtime
   * @internal
   */
  trailingSlash: Required<NuxtI18nOptions>['trailingSlash']
}
