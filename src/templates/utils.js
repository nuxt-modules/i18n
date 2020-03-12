import {
  defaultLocaleRouteNameSuffix,
  localeCodes,
  LOCALE_CODE_KEY,
  LOCALE_DOMAIN_KEY,
  LOCALE_FILE_KEY,
  MODULE_NAME,
  routesNameSeparator,
  vuex
} from './options'

/**
 * Asynchronously load messages from translation files
 * @param  {Context}  context  Nuxt context
 * @param  {String}   locale  Language code to load
 */
export async function loadLanguageAsync (context, locale) {
  const { app } = context

  if (!app.i18n.loadedLanguages) {
    app.i18n.loadedLanguages = []
  }

  if (!app.i18n.loadedLanguages.includes(locale)) {
    const langOptions = app.i18n.locales.find(l => l[LOCALE_CODE_KEY] === locale)
    if (langOptions) {
      const file = langOptions[LOCALE_FILE_KEY]
      if (file) {
        // Hiding template directives from eslint so that parsing doesn't break.
        /* <% if (options.langDir) { %> */
        try {
          const module = await import(/* webpackChunkName: "lang-[request]" */ '~/<%= options.langDir %>' + file)
          const messages = module.default ? module.default : module
          const result = typeof messages === 'function' ? await Promise.resolve(messages(context)) : messages
          app.i18n.setLocaleMessage(locale, result)
          app.i18n.loadedLanguages.push(locale)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error)
        }
        /* <% } %> */
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[${MODULE_NAME}] Could not find lang file for locale ${locale}`)
      }
    }
  }
}

const isObject = value => value && !Array.isArray(value) && typeof value === 'object'

/**
 * Validate setRouteParams action's payload
 * @param {*} routeParams The action's payload
 */
export const validateRouteParams = routeParams => {
  if (!isObject(routeParams)) {
    // eslint-disable-next-line no-console
    console.warn(`[${MODULE_NAME}] Route params should be an object`)
    return
  }
  Object.entries(routeParams).forEach(([key, value]) => {
    if (!localeCodes.includes(key)) {
    // eslint-disable-next-line no-console
      console.warn(`[${MODULE_NAME}] Trying to set route params for key ${key} which is not a valid locale`)
    } else if (!isObject(value)) {
    // eslint-disable-next-line no-console
      console.warn(`[${MODULE_NAME}] Trying to set route params for locale ${key} with a non-object value`)
    }
  })
}

const trailingSlashRE = /\/?$/

/**
 * Determines if objects are equal.
 *
 * @param {Object} [a={}]
 * @param {Object} [b={}]
 * @return {boolean} True if objects equal, False otherwise.
 */
function isObjectEqual (a = {}, b = {}) {
  // handle null value #1566
  if (!a || !b) {
    return a === b
  }
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) {
    return false
  }
  return aKeys.every(key => {
    const aVal = a[key]
    const bVal = b[key]
    // check nested equality
    if (typeof aVal === 'object' && typeof bVal === 'object') {
      return isObjectEqual(aVal, bVal)
    }
    return String(aVal) === String(bVal)
  })
}

/**
 * Determines if two routes are the same.
 *
 * @param {Route} a
 * @param {Route} [b]
 * @return {boolean} True if routes the same, False otherwise.
 */
export function isSameRoute (a, b) {
  if (!b) {
    return false
  }
  if (a.path && b.path) {
    return (
      a.path.replace(trailingSlashRE, '') === b.path.replace(trailingSlashRE, '') &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query)
    )
  }
  if (a.name && b.name) {
    return (
      a.name === b.name &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query) &&
      isObjectEqual(a.params, b.params)
    )
  }
  return false
}

/**
 * Get locale code that corresponds to current hostname
 * @param  {VueI18n} nuxtI18n Instance of VueI18n
 * @param  {object} req Request object
 * @return {String} Locade code found if any
 */
export const getLocaleDomain = (nuxtI18n, req) => {
  const hostname = process.client ? window.location.hostname : (req.headers['x-forwarded-host'] || req.headers.host)
  if (hostname) {
    const localeDomain = nuxtI18n.locales.find(l => l[LOCALE_DOMAIN_KEY] === hostname)
    if (localeDomain) {
      return localeDomain[LOCALE_CODE_KEY]
    }
  }
  return null
}

/**
 * Extract locale code from given route:
 * - If route has a name, try to extract locale from it
 * - Otherwise, fall back to using the routes'path
 * @param  {Object} route               Route
 * @return {String}                     Locale code found if any
 */
export const getLocaleFromRoute = (route = {}) => {
  const localesPattern = `(${localeCodes.join('|')})`
  const defaultSuffixPattern = `(?:${routesNameSeparator}${defaultLocaleRouteNameSuffix})?`
  // Extract from route name
  if (route.name) {
    const regexp = new RegExp(`${routesNameSeparator}${localesPattern}${defaultSuffixPattern}$`, 'i')
    const matches = route.name.match(regexp)
    if (matches && matches.length > 1) {
      return matches[1]
    }
  } else if (route.path) {
    // Extract from path
    const regexp = new RegExp(`^/${localesPattern}/`, 'i')
    const matches = route.path.match(regexp)
    if (matches && matches.length > 1) {
      return matches[1]
    }
  }
  return null
}

/**
 * Dispatch store module actions to keep it in sync with app's locale data
 * @param  {Store} store     Vuex store
 * @param  {String} locale   Current locale
 * @param  {Object} messages Current messages
 * @return {Promise(void)}
 */
export const syncVuex = async (store, locale = null, messages = null) => {
  if (vuex && store) {
    if (locale !== null && vuex.syncLocale) {
      await store.dispatch(vuex.moduleName + '/setLocale', locale)
    }
    if (messages !== null && vuex.syncMessages) {
      await store.dispatch(vuex.moduleName + '/setMessages', messages)
    }
  }
}
