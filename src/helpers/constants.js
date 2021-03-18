import packageJson from '../../package.json'

/**
 * @typedef {import('../../types/internal').ResolvedOptions} ResolvedOptions
 * @typedef {import('../../types').LocaleObject} LocaleObject
 */

// Internals
export const MODULE_NAME = packageJson.name
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

export const COMPONENT_OPTIONS_KEY = 'nuxtI18n'

/** @type {ResolvedOptions} */
export const DEFAULT_OPTIONS = {
  vueI18n: {},
  vueI18nLoader: false,
  locales: [],
  defaultLocale: '',
  defaultDirection: 'ltr',
  routesNameSeparator: '___',
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
    onlyOnNoPrefix: false,
    onlyOnRoot: false,
    useCookie: true
  },
  differentDomains: false,
  seo: false,
  baseUrl: '',
  vuex: {
    moduleName: 'i18n',
    syncLocale: false,
    syncMessages: false,
    syncRouteParams: true
  },
  parsePages: true,
  pages: {},
  skipSettingLocaleOnNavigate: false,
  beforeLanguageSwitch: () => null,
  onLanguageSwitched: () => null
}

/** @type {[keyof Pick<ResolvedOptions, 'detectBrowserLanguage'>, keyof Pick<ResolvedOptions, 'vuex'>]} */
export const NESTED_OPTIONS = ['detectBrowserLanguage', 'vuex']
