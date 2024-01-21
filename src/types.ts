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
  customRoutes?: 'page' | 'config'
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

export type VueI18nConfig = () => Promise<{ default: I18nOptions | (() => I18nOptions | Promise<I18nOptions>) }>

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RouterOptions } from 'vue-router'
import type { STRATEGIES } from './constants'
import type { NuxtPage } from '@nuxt/schema'

/**
 * Route config for vue-router v4
 *
 * @public
 */
interface Route {
  name?: string
  path: string
  file?: string // for nuxt bridge & nuxt 3
  children?: Route[]
}

/**
 * Route config for i18n routing
 *
 * @public
 */
export type I18nRoute = Route & { redirect?: string }

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
export interface LocaleObject extends Record<string, any> {
  code: Locale
  name?: string
  dir?: Directions
  domain?: string
  file?: string | LocaleFile
  files?: string[] | LocaleFile[]
  isCatchallLocale?: boolean
  iso?: string
}

/**
 * Simple Locale object
 *
 * @public
 */
export interface SimpleLocaleObject extends Record<string, any> {
  code: Locale
  name?: string
  dir?: Directions
  domain?: string
  file?: string
  files?: string[]
  isCatchallLocale?: boolean
  iso?: string
}

/**
 * @public
 */
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
  locales: readonly string[]
  paths: Record<string, string>
}

/**
 * Resolver for route localizing options
 *
 * @public
 */
export type RouteOptionsResolver = (route: I18nRoute, localeCodes: string[]) => ComputedRouteOptions | null

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
 * Localize route path prefix judgment logic in {@link localizeRoutes} function
 *
 * @public
 */
export type LocalizeRoutesPrefixable = (options: PrefixLocalizedRouteOptions) => boolean

/**
 * Options to initialize a VueRouter instance
 *
 * @remarks
 * This options is extended from Vue Router `RouterOptioins`, so you can specify those options.
 *
 * @public
 */
export type I18nRoutingOptions<
  Context = unknown,
  ConfiguredLocaleType extends string[] | LocaleObject[] = string[] | LocaleObject[]
> = {
  /**
   * Vue Router version
   *
   * @remarks
   * You can choice between vue-router v3 and v4.
   *
   * If you specify `3`, this function return Vue Router v3 instance, else specify `4`, this function return Vue Router v4 instance.
   *
   * @defaultValue 4
   */
  version?: 3 | 4
  /**
   * The app's default locale
   *
   * @remarks
   * When using `prefix_except_default` strategy, URLs for locale specified here won't have a prefix.
   *
   * It's recommended to set this to some locale regardless of chosen strategy, as it will be used as a fallback locale when navigating to a non-existent route
   *
   * @defaultValue '' (emputy string)
   */
  defaultLocale?: string
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
  /**
   * Route options resolver
   *
   * @defaultValue undefined
   */
  routeOptionsResolver?: RouteOptionsResolver
  /**
   * Whether to prefix the route path with the locale or not
   *
   * @defaultValue {@link DefaultPrefixable}
   */
  prefixable?: Prefixable
  /**
   * An option that Intercepter for custom processing for paths resolved with {@link switchLocalePath}
   *
   * @defaultValue {@link DefaultSwitchLocalePathIntercepter}
   */
  switchLocalePathIntercepter?: SwitchLocalePathIntercepter
  /**
   * Whether to prefix the localize route path with the locale or not
   *
   * @defaultValue {@link DefaultLocalizeRoutesPrefixable}
   */
  localizeRoutesPrefixable?: LocalizeRoutesPrefixable
  /**
   * The key which to access vue router meta object, when dynamic route params need localize.
   *
   * @defaultValue ''
   */
  dynamicRouteParamsKey?: string | symbol
} & RouterOptions

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
   * Adds a `dir` attribute to the HTML element.
   *
   * @defaultValue false
   */
  addDirAttribute?: boolean
  /**
   * Adds various SEO attributes.
   *
   * @defaultValue false
   */
  addSeoAttributes?: boolean | SeoAttributesOptions
  /**
   * Identifier attribute of `<meta>` tag
   *
   * @defaultValue 'hid'
   */
  identifierAttribute?: string
}

/**
 * Meta attributes for head properties.
 *
 * @public
 */
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
 * Route path prefix judgment logic in {@link resolveRoute} function
 */
export type Prefixable = (optons: PrefixableOptions) => boolean

/**
 * The intercept handler which is called in {@link switchLocalePath} function
 */
export type SwitchLocalePathIntercepter = (path: string, locale: Locale) => string
