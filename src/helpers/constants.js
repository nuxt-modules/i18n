const packageJson = require('../../package.json')

// Internals
export const MODULE_NAME = packageJson.name
export const ROOT_DIR = 'nuxt-i18n'
export const HELPERS_PATH = 'helpers/'
export const PLUGINS_DIR = 'plugins/'
export const TEMPLATES_DIR = 'templates/'
export const LOCALE_CODE_KEY = 'code'
export const LOCALE_ISO_KEY = 'iso'
export const LOCALE_DOMAIN_KEY = 'domain'
export const LOCALE_FILE_KEY = 'file'

// Options
export const STRATEGIES = {
  PREFIX: 'prefix',
  PREFIX_EXCEPT_DEFAULT: 'prefix_except_default',
  PREFIX_AND_DEFAULT: 'prefix_and_default'
}
export const COMPONENT_OPTIONS_KEY = 'nuxtI18n'
export const DEFAULT_OPTIONS = {
  vueI18n: {},
  locales: [],
  defaultLocale: null,
  routesNameSeparator: '___',
  strategy: STRATEGIES.PREFIX_EXCEPT_DEFAULT,
  lazy: false,
  langDir: null,
  rootRedirect: null,
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'i18n_redirected'
  },
  differentDomains: false,
  forwardedHost: false,
  seo: true,
  vuex: {
    moduleName: 'i18n',
    mutations: {
      setLocale: 'I18N_SET_LOCALE',
      setMessages: 'I18N_SET_MESSAGES'
    }
  },
  parsePages: true,
  pages: {},
  beforeLanguageSwitch: () => null,
  onLanguageSwitched: () => null
}
export const NESTED_OPTIONS = ['detectBrowserLanguage', 'vuex']
