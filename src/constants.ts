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
export const STRATEGY_PREFIX = 'prefix'
export const STRATEGY_PREFIX_EXCEPT_DEFAULT = 'prefix_except_default'
export const STRATEGY_PREFIX_AND_DEFAULT = 'prefix_and_default'
export const STRATEGY_NO_PREFIX = 'no_prefix'
export const STRATEGIES = {
  PREFIX: STRATEGY_PREFIX,
  PREFIX_EXCEPT_DEFAULT: STRATEGY_PREFIX_EXCEPT_DEFAULT,
  PREFIX_AND_DEFAULT: STRATEGY_PREFIX_AND_DEFAULT,
  NO_PREFIX: STRATEGY_NO_PREFIX
} as const

export const DYNAMIC_PARAMS_KEY = 'nuxtI18nInternal'
export const DEFAULT_COOKIE_KEY = 'i18n_redirected'
export const SWITCH_LOCALE_PATH_LINK_IDENTIFIER = 'nuxt-i18n-slp'
export const FULL_STATIC_LIFETIME = 60 * 60 * 24 // 1 day in seconds

export const DEFAULT_OPTIONS = {
  restructureDir: 'i18n',
  experimental: {
    localeDetector: '',
    typedPages: true,
    typedOptionsAndMessages: false,
    alternateLinkCanonicalQueries: true,
    devCache: false,
    cacheLifetime: undefined,
    stripMessagesPayload: false,
    preload: false,
    strictSeo: false,
    nitroContextDetection: true
  },
  bundle: {
    compositionOnly: true,
    runtimeOnly: false,
    fullInstall: true,
    dropMessageCompiler: false
  },
  compilation: {
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
  langDir: 'locales',
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
  customRoutes: 'page',
  pages: {},
  skipSettingLocaleOnNavigate: false,
  types: 'composition',
  debug: false,
  parallelPlugin: false,
  multiDomainLocales: false,
  hmr: true,
  autoDeclare: true
} as const

export const DEFINE_I18N_ROUTE_FN = 'defineI18nRoute'
export const DEFINE_I18N_LOCALE_FN = 'defineI18nLocale'
export const DEFINE_I18N_CONFIG_FN = 'defineI18nConfig'
export const DEFINE_LOCALE_DETECTOR_FN = 'defineI18nLocaleDetector'
export const NUXT_I18N_VIRTUAL_PREFIX = '#nuxt-i18n'

const TS_EXTENSIONS = ['.ts', '.cts', '.mts']
const JS_EXTENSIONS = ['.js', '.cjs', '.mjs']
export const EXECUTABLE_EXTENSIONS = [...JS_EXTENSIONS, ...TS_EXTENSIONS]
export const EXECUTABLE_EXT_RE = /\.[c|m]?[j|t]s$/
