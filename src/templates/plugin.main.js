import Vue from 'vue'
import VueI18n from 'vue-i18n'
import { nuxtI18nSeo } from './seo-head'
import {
  baseUrl,
  beforeLanguageSwitch,
  defaultLocale,
  defaultLocaleRouteNameSuffix,
  detectBrowserLanguage,
  differentDomains,
  IS_UNIVERSAL_MODE,
  lazy,
  LOCALE_CODE_KEY,
  LOCALE_DOMAIN_KEY,
  localeCodes,
  locales,
  MODULE_NAME,
  onLanguageSwitched,
  rootRedirect,
  routesNameSeparator,
  STRATEGIES,
  strategy,
  vueI18n,
  vuex
} from './options'
import {
  createLocaleFromRouteGetter,
  getLocaleCookie,
  getLocaleDomain,
  getLocalesRegex,
  resolveBaseUrl,
  matchBrowserLocale,
  parseAcceptLanguage,
  registerStore,
  setLocaleCookie,
  syncVuex
} from './utils-common'
import { klona } from '~i18n-klona'

Vue.use(VueI18n)

const { alwaysRedirect, onlyOnNoPrefix, onlyOnRoot, fallbackLocale } = detectBrowserLanguage
const getLocaleFromRoute = createLocaleFromRouteGetter(localeCodes, { routesNameSeparator, defaultLocaleRouteNameSuffix })

/** @type {import('@nuxt/types').Plugin} */
export default async (context) => {
  const { app, route, store, req, res, redirect } = context

  if (vuex && store) {
    registerStore(store, vuex, localeCodes, MODULE_NAME)
  }

  if (process.server && lazy) {
    context.beforeNuxtRender(({ nuxtState }) => {
      const langs = {}
      const { fallbackLocale, locale } = app.i18n
      if (locale) {
        langs[locale] = app.i18n.getLocaleMessage(locale)
      }
      if (fallbackLocale && locale !== fallbackLocale) {
        langs[fallbackLocale] = app.i18n.getLocaleMessage(fallbackLocale)
      }
      nuxtState.__i18n = { langs }
    })
  }

  const { useCookie, cookieKey, cookieDomain, cookieSecure, cookieCrossOrigin } = detectBrowserLanguage

  const loadAndSetLocale = async (newLocale, { initialSetup = false } = {}) => {
    // Abort if different domains option enabled
    if (!initialSetup && app.i18n.differentDomains) {
      return
    }

    // Abort if newLocale did not change
    if (newLocale === app.i18n.locale) {
      return
    }

    const oldLocale = app.i18n.locale

    if (!initialSetup) {
      app.i18n.beforeLanguageSwitch(oldLocale, newLocale)
    }

    if (useCookie) {
      app.i18n.setLocaleCookie(newLocale)
    }

    // Lazy-loading enabled
    if (lazy) {
      const { loadLanguageAsync } = require('./utils')
      const i18nFallbackLocale = app.i18n.fallbackLocale

      // Load fallback locale(s).
      if (i18nFallbackLocale) {
        let localesToLoadPromises = []
        if (Array.isArray(i18nFallbackLocale)) {
          localesToLoadPromises = i18nFallbackLocale.map(fbLocale => loadLanguageAsync(context, fbLocale))
        } else if (typeof i18nFallbackLocale === 'object') {
          if (i18nFallbackLocale[newLocale]) {
            localesToLoadPromises = localesToLoadPromises.concat(i18nFallbackLocale[newLocale].map(fbLocale => loadLanguageAsync(context, fbLocale)))
          }
          if (i18nFallbackLocale.default) {
            localesToLoadPromises = localesToLoadPromises.concat(i18nFallbackLocale.default.map(fbLocale => loadLanguageAsync(context, fbLocale)))
          }
        } else if (newLocale !== i18nFallbackLocale) {
          localesToLoadPromises.push(loadLanguageAsync(context, i18nFallbackLocale))
        }
        await Promise.all(localesToLoadPromises)
      }

      await loadLanguageAsync(context, newLocale)
    }

    app.i18n.locale = newLocale
    app.i18n.localeProperties = klona(locales.find(l => l[LOCALE_CODE_KEY] === newLocale) || { code: newLocale })

    await syncVuex(store, newLocale, app.i18n.getLocaleMessage(newLocale), { vuex })

    // Must retrieve from context as it might have changed since plugin initialization.
    const { route } = context
    const redirectPath = getRedirectPathForLocale(route, newLocale)

    if (initialSetup) {
      // Redirect will be delayed until middleware runs as redirecting from plugin does not
      // work in SPA (https://github.com/nuxt/nuxt.js/issues/4491).
      app.i18n.__redirect = redirectPath
    } else {
      app.i18n.onLanguageSwitched(oldLocale, newLocale)

      if (redirectPath) {
        redirect(redirectPath)
      }
    }
  }

  const getRedirectPathForLocale = (route, locale) => {
    // Redirects are ignored if it is a nuxt generate.
    if (process.static && process.server) {
      return ''
    }

    if (!locale || app.i18n.differentDomains || strategy === STRATEGIES.NO_PREFIX) {
      return ''
    }

    if (getLocaleFromRoute(route) === locale) {
      // If "onlyOnRoot" or "onlyOnNoPrefix" is set and strategy is "prefix_and_default", prefer unprefixed route for
      // default locale.
      if (!(onlyOnRoot || onlyOnNoPrefix) || locale !== defaultLocale || strategy !== STRATEGIES.PREFIX_AND_DEFAULT) {
        return ''
      }
    }

    // At this point we are left with route that either has no or different locale.
    let redirectPath = app.switchLocalePath(locale)

    if (!redirectPath) {
      // Current route could be 404 in which case attempt to find matching route for given locale.
      redirectPath = app.localePath(route.fullPath, locale)
    }

    if (redirectPath === route.fullPath) {
      return ''
    }

    return redirectPath
  }

  // Called by middleware on navigation (also on the initial one).
  const onNavigate = async route => {
    // Handle root path redirect
    if (route.path === '/' && rootRedirect) {
      let statusCode = 302
      let path = rootRedirect

      if (typeof rootRedirect !== 'string') {
        statusCode = rootRedirect.statusCode
        path = rootRedirect.path
      }

      return [statusCode, `/${path}`, /* preserve query */true]
    }

    const storedRedirect = app.i18n.__redirect
    if (storedRedirect) {
      app.i18n.__redirect = null
      return [302, storedRedirect]
    }

    app.i18n.__baseUrl = resolveBaseUrl(baseUrl, context)

    const finalLocale =
      (detectBrowserLanguage && doDetectBrowserLanguage(route)) ||
      getLocaleFromRoute(route) || app.i18n.locale || app.i18n.defaultLocale || ''

    await app.i18n.setLocale(finalLocale)

    return [null, null]
  }

  const getBrowserLocale = () => {
    if (process.client && typeof navigator !== 'undefined' && navigator.languages) {
      // Get browser language either from navigator if running on client side, or from the headers
      return matchBrowserLocale(locales, navigator.languages)
    } else if (req && typeof req.headers['accept-language'] !== 'undefined') {
      return matchBrowserLocale(locales, parseAcceptLanguage(req.headers['accept-language']))
    } else {
      return undefined
    }
  }

  const doDetectBrowserLanguage = route => {
    // Browser detection is ignored if it is a nuxt generate.
    if (process.static && process.server) {
      return false
    }

    if (strategy !== STRATEGIES.NO_PREFIX) {
      if (onlyOnRoot) {
        if (route.path !== '/') {
          return false
        }
      } else if (onlyOnNoPrefix) {
        if (!alwaysRedirect && route.path.match(getLocalesRegex(localeCodes))) {
          return false
        }
      }
    }

    let matchedLocale

    if (useCookie && (matchedLocale = app.i18n.getLocaleCookie())) {
      // Get preferred language from cookie if present and enabled
    } else {
      // Try to get locale from either navigator or header detection
      matchedLocale = getBrowserLocale()
    }

    const finalLocale = matchedLocale || fallbackLocale

    // Handle cookie option to prevent multiple redirections
    if (finalLocale && (!useCookie || alwaysRedirect || !app.i18n.getLocaleCookie())) {
      if (finalLocale !== app.i18n.locale) {
        return finalLocale
      }
    }

    return false
  }

  const extendVueI18nInstance = i18n => {
    i18n.locales = locales
    i18n.defaultLocale = defaultLocale
    i18n.differentDomains = differentDomains
    i18n.beforeLanguageSwitch = beforeLanguageSwitch
    i18n.onLanguageSwitched = onLanguageSwitched
    i18n.setLocaleCookie = locale => setLocaleCookie(locale, res, { useCookie, cookieDomain, cookieKey, cookieSecure, cookieCrossOrigin })
    i18n.getLocaleCookie = () => getLocaleCookie(req, { useCookie, cookieKey, localeCodes })
    i18n.setLocale = (locale) => loadAndSetLocale(locale)
    i18n.getBrowserLocale = () => getBrowserLocale()
    i18n.__baseUrl = app.i18n.__baseUrl
  }

  // Set instance options
  const vueI18nOptions = typeof vueI18n === 'function' ? vueI18n(context) : klona(vueI18n)
  vueI18nOptions.componentInstanceCreatedListener = extendVueI18nInstance
  app.i18n = new VueI18n(vueI18nOptions)
  // Initialize locale and fallbackLocale as vue-i18n defaults those to 'en-US' if falsey
  app.i18n.locale = ''
  app.i18n.localeProperties = { code: '' }
  app.i18n.fallbackLocale = vueI18nOptions.fallbackLocale || ''
  extendVueI18nInstance(app.i18n)
  app.i18n.__baseUrl = resolveBaseUrl(baseUrl, context)
  app.i18n.__onNavigate = onNavigate

  // Inject seo function
  Vue.prototype.$nuxtI18nSeo = nuxtI18nSeo

  if (store) {
    // Inject in store.
    store.$i18n = app.i18n

    if (store.state.localeDomains) {
      app.i18n.locales.forEach(locale => {
        locale.domain = store.state.localeDomains[locale.code]
      })
    }
  }

  let finalLocale = detectBrowserLanguage && doDetectBrowserLanguage(route)

  if (!finalLocale) {
    if (vuex && vuex.syncLocale && store && store.state[vuex.moduleName].locale !== '') {
      finalLocale = store.state[vuex.moduleName].locale
    } else if (app.i18n.differentDomains) {
      const options = { localDomainKey: LOCALE_DOMAIN_KEY, localeCodeKey: LOCALE_CODE_KEY }
      const domainLocale = getLocaleDomain(locales, req, options)
      finalLocale = domainLocale
    } else if (strategy !== STRATEGIES.NO_PREFIX) {
      const routeLocale = getLocaleFromRoute(route)
      finalLocale = routeLocale
    } else if (useCookie) {
      finalLocale = app.i18n.getLocaleCookie()
    }
  }

  if (!finalLocale) {
    finalLocale = app.i18n.defaultLocale || ''
  }

  await loadAndSetLocale(finalLocale, { initialSetup: true })

  if (process.client && process.static && IS_UNIVERSAL_MODE) {
    const [_, redirectTo] = await onNavigate(context.route)
    if (redirectTo) {
      location.assign(redirectTo)
    }
  }
}
