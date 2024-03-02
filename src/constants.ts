export const NUXT_I18N_MODULE_ID = '@nuxtjs/i18n' as const
export const VUE_I18N_PKG = 'vue-i18n' as const
export const SHARED_PKG = '@intlify/shared' as const
export const MESSAGE_COMPILER_PKG = '@intlify/message-compiler' as const
export const CORE_PKG = '@intlify/core' as const
export const CORE_BASE_PKG = '@intlify/core-base' as const
export const H3_PKG = '@intlify/h3' as const
export const UTILS_PKG = '@intlify/utils' as const
export const UTILS_H3_PKG = '@intlify/utils/h3' as const
export const UFO_PKG = 'ufo' as const
export const IS_HTTPS_PKG = 'is-https' as const

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

export const DEFAULT_DYNAMIC_PARAMS_KEY = 'nuxtI18nInternal'
export const DEPRECATED_DYNAMIC_PARAMS_KEY = 'nuxtI18n'
export const DEFAULT_COOKIE_KEY = 'i18n_redirected'

export const DEFAULT_OPTIONS = {
  experimental: {
    localeDetector: ''
  },
  bundle: {
    compositionOnly: true,
    runtimeOnly: false,
    fullInstall: true,
    dropMessageCompiler: false
  },
  compilation: {
    jit: true,
    strictMessage: true,
    escapeHtml: false
  },
  customBlocks: {
    defaultSFCLang: 'json',
    globalSFCScope: false
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
    cookieKey: DEFAULT_COOKIE_KEY,
    cookieSecure: false,
    fallbackLocale: '',
    redirectOn: 'root',
    useCookie: true
  },
  differentDomains: false,
  baseUrl: '',
  customRoutes: 'page',
  pages: {},
  skipSettingLocaleOnNavigate: false,
  types: 'composition',
  debug: false,
  parallelPlugin: false
} as const

export const NUXT_I18N_TEMPLATE_OPTIONS_KEY = 'i18n.options.mjs' as const
export const NUXT_I18N_COMPOSABLE_DEFINE_ROUTE = 'defineI18nRoute' as const
export const NUXT_I18N_COMPOSABLE_DEFINE_LOCALE = 'defineI18nLocale' as const
export const NUXT_I18N_COMPOSABLE_DEFINE_CONFIG = 'defineI18nConfig' as const
export const NUXT_I18N_COMPOSABLE_DEFINE_LOCALE_DETECTOR = 'defineI18nLocaleDetector' as const

export const TS_EXTENSIONS = ['.ts', '.cts', '.mts']
export const JS_EXTENSIONS = ['.js', '.cjs', '.mjs']
export const EXECUTABLE_EXTENSIONS = [...JS_EXTENSIONS, ...TS_EXTENSIONS]

export const NULL_HASH = '00000000' as const

export type NuxtI18nOptionsDefault = typeof DEFAULT_OPTIONS
