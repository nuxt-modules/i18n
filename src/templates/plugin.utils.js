import isHTTPS from 'is-https'
import { localeMessages, options } from './options'
import { formatMessage } from './utils-common'
// @ts-ignore
import { hasProtocol } from '~i18n-ufo'

/** @typedef {import('../../types/internal').ResolvedOptions} ResolvedOptions */

/**
 * Asynchronously load messages from translation files
 *
 * @param {import('@nuxt/types').Context} context
 * @param {string} locale Language code to load
 * @return {Promise<void>}
 */
export async function loadLanguageAsync (context, locale) {
  const { app } = context
  const { i18n } = app

  if (!i18n.loadedLanguages) {
    i18n.loadedLanguages = []
  }

  if (!i18n.loadedLanguages.includes(locale)) {
    const localeObject = options.normalizedLocales.find(l => l.code === locale)
    if (localeObject) {
      const { file } = localeObject
      if (file) {
        /* <% if (options.options.langDir) { %> */
        /** @type {import('vue-i18n').LocaleMessageObject | undefined} */
        let messages
        if (process.client) {
          const { nuxtState } = context
          if (nuxtState && nuxtState.__i18n && nuxtState.__i18n.langs[locale]) {
            messages = nuxtState.__i18n.langs[locale]
            // Even if already cached in Nuxt state, trigger locale import so that HMR kicks-in on changes to that file.
            if (context.isDev) {
              localeMessages[file]()
            }
          }
        }
        if (!messages) {
          try {
            // @ts-ignore
            const getter = await localeMessages[file]().then(m => m.default || m)
            messages = typeof getter === 'function' ? await Promise.resolve(getter(context, locale)) : getter
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(formatMessage(`Failed loading async locale export: ${error.message}`))
          }
        }
        if (messages) {
          i18n.setLocaleMessage(locale, messages)
          i18n.loadedLanguages.push(locale)
        }
        /* <% } %> */
      } else {
        console.warn(formatMessage(`Could not find lang file for locale ${locale}`))
      }
    } else {
      console.warn(formatMessage(`Attempted to load messages for non-existant locale code "${locale}"`))
    }
  }
}

/**
 * Resolves base URL value if provided as function. Otherwise just returns verbatim.
 *
 * @param {string | ((context: import('@nuxt/types').Context) => string)} baseUrl
 * @param {import('@nuxt/types').Context} context
 * @param {import('../../types').Locale} localeCode
 * @param {Pick<ResolvedOptions, 'differentDomains' | 'normalizedLocales'>} options
 * @return {string}
 */
export function resolveBaseUrl (baseUrl, context, localeCode, { differentDomains, normalizedLocales }) {
  if (typeof baseUrl === 'function') {
    return baseUrl(context)
  }

  if (differentDomains && localeCode) {
    // Lookup the `differentDomain` origin associated with given locale.
    const domain = getDomainFromLocale(localeCode, context.req, { normalizedLocales })
    if (domain) {
      return domain
    }
  }

  return baseUrl
}

/**
 * Gets the `differentDomain` domain from locale.
 *
 * @param {string} localeCode
 * @param {import('http').IncomingMessage | undefined} req
 * @param {Pick<ResolvedOptions, 'normalizedLocales'>} options
 * @return {string | undefined}
 */
export function getDomainFromLocale (localeCode, req, { normalizedLocales }) {
// Lookup the `differentDomain` origin associated with given locale.
  const lang = normalizedLocales.find(locale => locale.code === localeCode)
  if (lang && lang.domain) {
    if (hasProtocol(lang.domain)) {
      return lang.domain
    }
    let protocol
    if (process.server) {
      protocol = (req && isHTTPS(req)) ? 'https' : 'http'
    } else {
      protocol = window.location.protocol.split(':')[0]
    }
    return `${protocol}://${lang.domain}`
  }

  // eslint-disable-next-line no-console
  console.warn(formatMessage(`Could not find domain name for locale ${localeCode}`))
}

/**
 * @param {import('vuex').Store<Record<string, boolean>>} store
 * @param {Required<import('../../types').VuexOptions>} vuex
 * @param {readonly string[]} localeCodes
 */
export function registerStore (store, vuex, localeCodes) {
  /** @typedef {{
   *    locale?: string
   *    messages?: Record<string, string>
   *    routeParams?: Record<string, Record<string, string>>
   * }} ModuleStore
   *
   * @type {import('vuex').Module<ModuleStore, {}>}
   */
  const storeModule = {
    namespaced: true,
    state: () => ({
      ...(vuex.syncLocale ? { locale: '' } : {}),
      ...(vuex.syncMessages ? { messages: {} } : {}),
      ...(vuex.syncRouteParams ? { routeParams: {} } : {})
    }),
    actions: {
      ...(vuex.syncLocale
        ? {
            setLocale ({ commit }, locale) {
              commit('setLocale', locale)
            }
          }
        : {}),
      ...(vuex.syncMessages
        ? {
            setMessages ({ commit }, messages) {
              commit('setMessages', messages)
            }
          }
        : {}),
      ...(vuex.syncRouteParams
        ? {
            setRouteParams ({ commit }, params) {
              if (process.env.NODE_ENV === 'development') {
                validateRouteParams(params, localeCodes)
              }
              commit('setRouteParams', params)
            }
          }
        : {})
    },
    mutations: {
      ...(vuex.syncLocale
        ? {
            setLocale (state, locale) {
              state.locale = locale
            }
          }
        : {}),
      ...(vuex.syncMessages
        ? {
            setMessages (state, messages) {
              state.messages = messages
            }
          }
        : {}),
      ...(vuex.syncRouteParams
        ? {
            setRouteParams (state, params) {
              state.routeParams = params
            }
          }
        : {})
    },
    getters: {
      ...(vuex.syncRouteParams
        ? {
            localeRouteParams: ({ routeParams }) => {
              /** @type {(locale: string) => Record<string, string>} */
              const paramsGetter = locale => (routeParams && routeParams[locale]) || {}
              return paramsGetter
            }
          }
        : {})
    }
  }
  store.registerModule(vuex.moduleName, storeModule, { preserveState: !!store.state[vuex.moduleName] })
}

/**
 * Dispatch store module actions to keep it in sync with app's locale data
 *
 * @param  {import('vuex').Store<void>} store
 * @param  {string | null} locale The current locale
 * @param  {object | null} messages Current messages
 * @param  {ResolvedOptions['vuex']} vuex
 * @return {Promise<void>}
 */
export async function syncVuex (store, locale = null, messages = null, vuex) {
  if (vuex && store) {
    if (locale !== null && vuex.syncLocale) {
      await store.dispatch(vuex.moduleName + '/setLocale', locale)
    }
    if (messages !== null && vuex.syncMessages) {
      await store.dispatch(vuex.moduleName + '/setMessages', messages)
    }
  }
}

/**
 * Validate setRouteParams action's payload
 *
 * @param {object} routeParams The action's payload
 * @param {readonly string[]} localeCodes
 */
export function validateRouteParams (routeParams, localeCodes) {
  if (!isObject(routeParams)) {
    // eslint-disable-next-line no-console
    console.warn(formatMessage('Route params should be an object'))
    return
  }

  for (const [key, value] of Object.entries(routeParams)) {
    if (!localeCodes.includes(key)) {
    // eslint-disable-next-line no-console
      console.warn(formatMessage(`Trying to set route params for key ${key} which is not a valid locale`))
    } else if (!isObject(value)) {
    // eslint-disable-next-line no-console
      console.warn(formatMessage(`Trying to set route params for locale ${key} with a non-object value`))
    }
  }
}

/**
 * @param {any} value
 * @return {boolean}
 */
function isObject (value) {
  return value && !Array.isArray(value) && typeof value === 'object'
}
