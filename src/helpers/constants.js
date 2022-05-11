/**
 * @typedef {import('../../types').Options} Options
 */

// Internals
export const ROOT_DIR = 'nuxt-i18n'

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
}

const REDIRECT_ON_ALL = 'all'
const REDIRECT_ON_ROOT = 'root'
const REDIRECT_ON_NO_PREFIX = 'no prefix'
export const REDIRECT_ON_OPTIONS = {
  ALL: REDIRECT_ON_ALL,
  ROOT: REDIRECT_ON_ROOT,
  NO_PREFIX: REDIRECT_ON_NO_PREFIX
}

export const COMPONENT_OPTIONS_KEY = 'nuxtI18n'

/** @type {Options} */
export const DEFAULT_OPTIONS = {
  vueI18n: {},
  vueI18nLoader: false,
  locales: [],
  defaultLocale: '',
  defaultDirection: 'ltr',
  routesNameSeparator: '___',
  defaultLocaleRouteNameSuffix: 'default',
  sortRoutes: true,
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
  vuex: {
    moduleName: 'i18n',
    syncRouteParams: true
  },
  parsePages: true,
  pages: {},
  skipSettingLocaleOnNavigate: false,
  onBeforeLanguageSwitch: () => {},
  onLanguageSwitched: () => null
}
