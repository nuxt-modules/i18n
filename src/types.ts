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
 * Options for when to redirect to the detected locale.
 *
 * - `'all'`: redirect on all routes
 * - `'root'`: redirect only on root route
 * - `'no prefix'`: redirect only on routes without locale prefix
 */
export type RedirectOnOptions = 'all' | 'root' | 'no prefix'

/**
 * @public
 */
export interface DetectBrowserLanguageOptions {
  /**
   * Always redirect to the detected locale, not just on first visit
   *
   * @default false
   */
  alwaysRedirect?: boolean
  /**
   * Whether the cookie is cross-origin.
   *
   * @default false
   */
  cookieCrossOrigin?: boolean
  /**
   * Domain for the cookie.
   *
   * @default null
   */
  cookieDomain?: string | null
  /**
   * Key for the cookie.
   *
   * @default 'i18n_redirected'
   */
  cookieKey?: string
  /**
   * Whether the cookie is secure.
   *
   * @default false
   */
  cookieSecure?: boolean
  /**
   * Fallback locale if no locale is detected.
   *
   * @default ''
   */
  fallbackLocale?: Locale | null
  /**
   * When to redirect to the detected locale.
   *
   * @default 'root'
   */
  redirectOn?: RedirectOnOptions
  /**
   * Whether to use cookies to remember the detected locale.
   *
   * @default true
   */
  useCookie?: boolean
}

/**
 * @internal
 */
export type LocaleType = 'static' | 'dynamic' | 'unknown'

/**
 * Configuration for locale file loading.
 */
export type LocaleFile = {
  /** Path to the locale file */
  path: string
  /** Whether to cache the file */
  cache?: boolean
}

/**
 * Information about a locale including file metadata.
 */
export type LocaleInfo = Omit<LocaleObject, 'file' | 'files'> & {
  /** The locale code */
  code: Locale
  /** Metadata about the locale files */
  meta: FileMeta[]
}

/**
 * @internal
 * Metadata about a locale file.
 */
export type FileMeta = {
  path: string
  hash: string
  cache: boolean
  type: LocaleType
}

/**
 * @public
 */
export interface RootRedirectOptions {
  /**
   * The path to redirect to when accessing the root URL.
   */
  path: string
  /**
   * The HTTP status code to use for the redirect.
   */
  statusCode: number
}

type RouteLocationAsStringTypedListI18n<T = RouteMapGeneric extends RouteMapI18n ? RouteMapGeneric : RouteMapI18n> = {
  [N in keyof T]?: Partial<Record<Locale, `/${string}` | false>> | false
}

/**
 * Custom route pages configuration.
 */
export type CustomRoutePages = RouteLocationAsStringTypedListI18n

export interface ExperimentalFeatures {
  /**
   * Path to server-side locale detector resolved from `restructureDir` (`<rootDir>/i18n` by default)
   * @default undefined
   */
  localeDetector?: string
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
   * Removes non-canonical query parameters from alternate link meta tags
   * @default true
   */
  alternateLinkCanonicalQueries?: boolean
  /**
   * Enables caching of locale messages in dev mode
   * @default false
   */
  devCache?: boolean
  /**
   * Locale messages cache lifetime in seconds
   * - `-1` cache disabled
   * @default -1 // disabled, or `86400` (1 day) if all locale files are static files
   */
  cacheLifetime?: number
  /**
   * Preload locale messages and add them to the server-side rendered HTML.
   * This increases the size of the initial HTML payload but prevents an addition client-side request to load the messages.
   *
   * Since locale messages can be a large collection, it is recommended to use this in combination with `stripMessagesPayload`.
   * @default false
   */
  preload?: boolean
  /**
   * Strip unused locale messages from the server-side rendered HTML, reducing the size of the HTML payload.
   *
   * The `useI18nPreloadKeys` composable is used to prevent keys from being stripped, this is useful for conditionally rendered translations.
   * @default false // or `true` if `experimental.preload` is enabled
   */
  stripMessagesPayload?: boolean
  /**
   * Enables strict SEO mode.
   * @default false
   */
  strictSeo?: boolean | SeoAttributesOptions
  /**
   * Enables Nitro context detection and allows for more reliable detection and redirection behavior especially in setups using prerendering.
   * It is recommended to keep it enabled, but can be disabled if this causes issues, this option might be removed in v11.
   * @default true
   */
  nitroContextDetection?: boolean
}

export interface BundleOptions
  extends Pick<
    PluginOptions,
    'compositionOnly' | 'runtimeOnly' | 'fullInstall' | 'dropMessageCompiler' | 'onlyLocales'
  > {}

export interface CustomBlocksOptions extends Pick<PluginOptions, 'defaultSFCLang' | 'globalSFCScope'> {}

export interface LocaleMessageCompilationOptions {
  /**
   * Whether to strictly check that the locale message does not contain HTML tags. If HTML tags are included, an error is thrown.
   *
   * @default true
   */
  strictMessage?: boolean
  /**
   * Whether to escape HTML in messages.
   *
   * @default false
   */
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
  /**
   * Experimental configuration used to opt-in (or opt-out) of functionality as they stabilize.
   */
  experimental?: ExperimentalFeatures
  /**
   * The directory from which i18n files are resolved relative to the `<rootDir>` of the project.
   * @default 'i18n'
   */
  restructureDir?: string
  /**
   * Configure the bundling optimization for nuxt i18n module.
   */
  bundle?: BundleOptions
  /**
   * Configure flags that sets the behavior compilation of locale messages.
   */
  compilation?: LocaleMessageCompilationOptions
  /**
   * Configure the i18n custom blocks of SFC.
   */
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
  /**
   * Enables browser language detection to automatically redirect visitors to their preferred locale as they visit your site for the first time.
   *
   * Note that for better SEO it's recommended to set `redirectOn` to 'root'.
   * @see [Browser language detection](https://i18n.nuxtjs.org/docs/guide/browser-language-detection) for a guide.
   */
  detectBrowserLanguage?: DetectBrowserLanguageOptions | false
  /**
   * A relative path to a directory containing translation files to load.
   *
   * The path is resolved relative to the project `restructureDir` at the root of a project ('i18n' by default).
   * @default 'locales'
   * @warning Absolute paths will fail in production (eg. '/locales' should be changed into either 'locales' or './locales')
   */
  langDir?: string | null
  /**
   * If `customRoutes` option is disabled with config, the module will look for custom routes in the `pages` option.
   * @see Refer to the [Routing](https://i18n.nuxtjs.org/docs/guide) for usage.
   */
  pages?: CustomRoutePages
  /**
   * Whether custom paths are extracted from page files or configured in the module configuration:
   *
   * @example 'meta': custom paths are extracted from the definePageMeta() function in page components.
   * @example 'config': custom paths are extracted from the module configuration.
   * @example 'page': custom paths are extracted from the page files.
   *
   * @default 'page'
   */
  customRoutes?: 'page' | 'config' | 'meta'
  /**
   * Do not use in projects - this is used internally for e2e tests to override default option merging.
   * @internal
   */
  overrides?: Omit<NuxtI18nOptions<Context>, 'overrides'>
  /**
   * Set to a path to which you want to redirect users accessing the root URL ('/').
   *
   * Accepts either a string or an object with statusCode and path properties.
   *
   * @example
   * ```json
   * {
   *   "statusCode": 301,
   *   "path": "about-us"
   * }
   * ```
   */
  rootRedirect?: string | RootRedirectOptions
  /**
   * Status code used for localized redirects
   * @default 302
   */
  redirectStatusCode?: number
  /**
   * If true, the locale will not be set when navigating to a new locale.
   *
   * This is useful if you want to wait for the page transition to end before setting the locale yourself using `finalizePendingLocaleChange`.
   *
   * @see more information in [Wait for page transition](https://i18n.nuxtjs.org/docs/guide/lang-switcher#wait-for-page-transition).
   */
  skipSettingLocaleOnNavigate?: boolean
  /**
   * @deprecated This option is deprecated, only `'composition'` types will be supported in the future.
   * @default 'composition'
   */
  types?: 'composition' | 'legacy'
  /**
   * Whether to use `@nuxtjs/i18n` debug mode. If true or 'verbose', logs will be output to the console, setting this to 'verbose' will also log loaded messages objects.
   * @warning The purpose of this option is to help identify any problems with `@nuxtjs/i18n`.You should not enable this option in production as it will negatively impact performance.
   * @default false
   */
  debug?: boolean | 'verbose'
  /**
   * Set the plugin as parallel.
   * @see [nuxt plugin loading strategy](https://nuxt.com/docs/guide/directory-structure/plugins#loading-strategy).
   * @default false
   */
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
   * @deprecated This option is deprecated and will be removed in the future.
   * @default '___'
   */
  routesNameSeparator?: string
  /**
   * Internal suffix added to generated route names for default locale
   *
   * Relevant if strategy is `prefix_and_default` - you shouldn't need to change this.
   * @deprecated This option is deprecated and will be removed in the future.
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
   * @default ''
   */
  baseUrl?: string | BaseUrlResolveHandler<Context>
  /**
   * Hot module replacement for locale message files and vue-i18n configuration in dev mode.
   *
   * @defaultValue `true`
   */
  hmr?: boolean
  /**
   * Automatically imports/initializes `$t`, `$rt`, `$d`, `$n`, `$tm` and `$te` functions in `<script setup>` when used.
   *
   * This requires Nuxt's `autoImport` functionality to work.
   *
   * @example
   * ```vue
   * <script setup>
   * // const { t: $t } = useI18n() --- automatically declared
   * const title = computed(() => $t('my-title'))
   * </script>
   * ```
   * @default true
   */
  autoDeclare?: boolean
}

/**
 * Vue I18n configuration function.
 */
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
  /**
   * Unique identifier of the locale.
   * Used for route prefixing and as an argument in i18n utility functions.
   */
  code: T
  /**
   * User facing name for the locale.
   *
   * This is a custom property that can be used, for example, to define the language name
   * for the purpose of using it in a language selector on the page.
   */
  name?: string
  /**
   * The dir property specifies the direction of the elements and content.
   *
   * Value could be 'rtl', 'ltr' or 'auto'.
   */
  dir?: Directions
  /**
   * A language tag used for SEO features and for matching browser locales when using detectBrowserLanguage functionality.
   *
   * Should use the language tag syntax as defined by the IETF's BCP47, for example:
   * - 'en' (language subtag for English)
   * - 'fr-CA' (language+region subtags for French as used in Canada)
   * - 'zh-Hans' (language+script subtags for Chinese written with Simplified script)
   *
   * Required when using SEO features.
   */
  language?: string
  /**
   * Override default SEO catch-all and force this locale to be catch-all for its locale group.
   */
  isCatchallLocale?: boolean
  /**
   * The domain name you'd like to use for that locale (including the port if used).
   *
   * This property can also be set using runtimeConfig.
   *
   * @warning This property is required when using differentDomains
   */
  domain?: string
  /**
   * An array of domain names for this locale.
   *
   * This property is required when using multiDomainLocales while one or more of the domains having multiple of the same locales.
   */
  domains?: string[]
  /**
   * An array of domain names for which this locale should be the default locale.
   *
   * This property is optional when using multiDomainLocales.
   */
  defaultForDomains?: string[]
  /**
   * Set to true for each locale that should act as a default locale for the particular domain.
   *
   * This property is required when using differentDomains while one or more of the domains having multiple locales.
   */
  domainDefault?: boolean
  /**
   * The name of the file containing locale messages for this locale.
   *
   * Will be resolved relative to the langDir path when loading locale messages from file.
   */
  file?: string | LocaleFile
  /**
   * An array of file names containing locale messages for this locale.
   *
   * Will be resolved relative to the langDir path when loading locale messages from file.
   */
  files?: string[] | LocaleFile[]
}

/**
 * @public
 * @deprecated Configuring baseUrl as a function is deprecated and will be removed in the v11.
 *
 * Function to resolve the base URL dynamically based on context.
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
  /** HTML attributes for the HTML element */
  htmlAttrs: MetaAttrs
  /** Meta tags */
  meta: MetaAttrs[]
  /** Link tags */
  link: MetaAttrs[]
}

/**
 * Public runtime configuration for i18n.
 */
export interface I18nPublicRuntimeConfig {
  /** Base URL for the application */
  baseUrl: NuxtI18nOptions['baseUrl']
  /** Root redirect configuration */
  rootRedirect: NuxtI18nOptions['rootRedirect']
  /** Status code for redirects */
  redirectStatusCode?: NuxtI18nOptions['redirectStatusCode']
  /** Domain locales mapping */
  domainLocales: { [key: Locale]: { domain: string | undefined } }
  /** @internal Overwritten at build time, used to pass generated options to runtime */
  locales: NonNullable<Required<NuxtI18nOptions<unknown>>['locales']>
  /** @internal Overwritten at build time, used to pass generated options to runtime */
  defaultLocale: Required<NuxtI18nOptions>['defaultLocale']
  /** @internal Overwritten at build time, used to pass generated options to runtime */
  experimental: NonNullable<NuxtI18nOptions['experimental']>
  /** @internal Overwritten at build time, used to pass generated options to runtime */
  detectBrowserLanguage: Required<NuxtI18nOptions>['detectBrowserLanguage']
  /** @internal Overwritten at build time, used to pass generated options to runtime */
  skipSettingLocaleOnNavigate: Required<NuxtI18nOptions>['skipSettingLocaleOnNavigate']
}
