import type { NuxtI18nOptionsDefault } from './options'

export const NUXT_I18N_MODULE_ID = '@nuxtjs/i18n' as const
export const VUE_I18N_PKG = 'vue-i18n' as const
export const VUE_I18N_BRIDGE_PKG = '@intlify/vue-i18n-bridge' as const
export const VUE_ROUTER_BRIDGE_PKG = '@intlify/vue-router-bridge' as const
export const VUE_I18N_ROUTING_PKG = 'vue-i18n-routing' as const

// Options
const STRATEGY_PREFIX = 'prefix'
const STRATEGY_PREFIX_EXCEPT_DEFAULT = 'prefix_except_default'
const STRATEGY_PREFIX_AND_DEFAULT = 'prefix_and_default'
const STRATEGY_NO_PREFIX = 'no_prefix'
export const STRATEGIES = {
  PREFIX: STRATEGY_PREFIX,
  PREFIX_EXCEPT_DEFAULT: STRATEGY_PREFIX_EXCEPT_DEFAULT,
  PREFIX_AND_DEFAULT: STRATEGY_PREFIX_AND_DEFAULT,
  NO_PREFIX: STRATEGY_NO_PREFIX
} as const

const REDIRECT_ON_ALL = 'all'
const REDIRECT_ON_ROOT = 'root'
const REDIRECT_ON_NO_PREFIX = 'no prefix'
export const REDIRECT_ON_OPTIONS = {
  ALL: REDIRECT_ON_ALL,
  ROOT: REDIRECT_ON_ROOT,
  NO_PREFIX: REDIRECT_ON_NO_PREFIX
} as const

export const COMPONENT_OPTIONS_KEY = 'nuxtI18n'

export const DEFAULT_OPTIONS = {
  experimental: {
    jsTsFormatResource: false
  },
  compilation: {
    strictMessage: true,
    escapeHtml: false
  },
  vueI18n: '',
  locales: [] as string[],
  defaultLocale: '',
  defaultDirection: 'ltr',
  routesNameSeparator: '___',
  trailingSlash: false,
  defaultLocaleRouteNameSuffix: 'default',
  strategy: STRATEGY_PREFIX_EXCEPT_DEFAULT,
  lazy: false,
  langDir: null,
  rootRedirect: null,
  detectBrowserLanguage: {
    alwaysRedirect: false,
    cookieCrossOrigin: false,
    cookieDomain: null,
    cookieKey: 'i18n_redirected',
    cookieSecure: false,
    fallbackLocale: '',
    redirectOn: 'root',
    useCookie: true
  },
  differentDomains: false,
  baseUrl: '',
  dynamicRouteParams: false,
  customRoutes: 'page',
  pages: {},
  skipSettingLocaleOnNavigate: false,
  types: 'composition',
  debug: false
} as const

export const NUXT_I18N_LOCALE_PROXY_ID = '@nuxtjs/i18n/__locale__' as const
export const NUXT_I18N_CONFIG_PROXY_ID = '@nuxtjs/i18n/__config__' as const
export const NUXT_I18N_TEMPLATE_OPTIONS_KEY = 'i18n.options.mjs' as const
export const NUXT_I18N_COMPOSABLE_DEFINE_ROUTE = 'defineI18nRoute' as const
export const NUXT_I18N_COMPOSABLE_DEFINE_LOCALE = 'defineI18nLocale' as const
export const NUXT_I18N_COMPOSABLE_DEFINE_CONFIG = 'defineI18nConfig' as const

export const TS_EXTENSIONS = ['.ts', '.cts', '.mts']
export const JS_EXTENSIONS = ['.js', '.cjs', '.mjs']
export const EXECUTABLE_EXTENSIONS = [...JS_EXTENSIONS, ...TS_EXTENSIONS]

export const NULL_HASH = '00000000' as const

export type NuxtI18nOptionsDefault = typeof DEFAULT_OPTIONS
