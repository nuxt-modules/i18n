export const NUXT_I18N_MODULE_ID = '@nuxtjs/i18n'
export const VUE_I18N_PKG = 'vue-i18n'
export const SHARED_PKG = '@intlify/shared'
export const MESSAGE_COMPILER_PKG = '@intlify/message-compiler'
export const CORE_PKG = '@intlify/core'
export const CORE_BASE_PKG = '@intlify/core-base'
export const H3_PKG = '@intlify/h3'
export const UTILS_PKG = '@intlify/utils'
export const UTILS_H3_PKG = '@intlify/utils/h3'
export const UFO_PKG = 'ufo'
export const IS_HTTPS_PKG = 'is-https'

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

export const DEFAULT_DYNAMIC_PARAMS_KEY = 'nuxtI18n'
export const DEFAULT_COOKIE_KEY = 'i18n_redirected'
export const SWITCH_LOCALE_PATH_LINK_IDENTIFIER = 'nuxt-i18n-slp'

export const DEFAULT_OPTIONS = {
  experimental: {
    localeDetector: '',
    switchLocalePathLinkSSR: false,
    autoImportTranslationFunctions: false
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
  rootRedirect: undefined,
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
  dynamicRouteParams: false,
  customRoutes: 'page',
  pages: {},
  skipSettingLocaleOnNavigate: false,
  types: 'composition',
  debug: false,
  parallelPlugin: false
} as const

export const NUXT_I18N_TEMPLATE_OPTIONS_KEY = 'i18n.options.mjs'
export const NUXT_I18N_COMPOSABLE_DEFINE_ROUTE = 'defineI18nRoute'
export const NUXT_I18N_COMPOSABLE_DEFINE_LOCALE = 'defineI18nLocale'
export const NUXT_I18N_COMPOSABLE_DEFINE_CONFIG = 'defineI18nConfig'
export const NUXT_I18N_COMPOSABLE_DEFINE_LOCALE_DETECTOR = 'defineI18nLocaleDetector'

export const TS_EXTENSIONS = ['.ts', '.cts', '.mts']
export const JS_EXTENSIONS = ['.js', '.cjs', '.mjs']
export const EXECUTABLE_EXTENSIONS = [...JS_EXTENSIONS, ...TS_EXTENSIONS]

export const NULL_HASH = '00000000'
