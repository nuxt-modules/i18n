import Vue from 'vue'
import VueI18n from 'vue-i18n'
import { nuxtI18nSeo } from './seo-head'
import {
  baseUrl,
  beforeLanguageSwitch,
  defaultLocale,
  detectBrowserLanguage,
  differentDomains,
  lazy,
  localeCodes,
  locales,
  onLanguageSwitched,
  rootRedirect,
  STRATEGIES,
  strategy,
  vueI18n,
  vuex
} from './options'
import {
  getLocaleDomain,
  getLocaleFromRoute,
  syncVuex,
  validateRouteParams
} from './utils'
import {
  getLocaleCookie,
  resolveBaseUrl,
  matchBrowserLocale,
  parseAcceptLanguage,
  setLocaleCookie
} from './utils-common'

Vue.use(VueI18n)

/** @type {import('@nuxt/types').Plugin} */
export default async (context) => {
  const { app, route, store, req, res, redirect } = context

  if (vuex && store) {
    // Register Vuex module
    store.registerModule(vuex.moduleName, {
      namespaced: true,
      state: () => ({
        ...(vuex.syncLocale ? { locale: '' } : {}),
        ...(vuex.syncMessages ? { messages: {} } : {}),
        ...(vuex.syncRouteParams ? { routeParams: {} } : {})
      }),
      actions: {
        ...(vuex.syncLocale ? {
          setLocale ({ commit }, locale) {
            commit('setLocale', locale)
          }
        } : {}),
        ...(vuex.syncMessages ? {
          setMessages ({ commit }, messages) {
            commit('setMessages', messages)
          }
        } : {}),
        ...(vuex.syncRouteParams ? {
          setRouteParams ({ commit }, params) {
            if (process.env.NODE_ENV === 'development') {
              validateRouteParams(params)
            }
            commit('setRouteParams', params)
          }
        } : {})
      },
      mutations: {
        ...(vuex.syncLocale ? {
          setLocale (state, locale) {
            state.locale = locale
          }
        } : {}),
        ...(vuex.syncMessages ? {
          setMessages (state, messages) {
            state.messages = messages
          }
        } : {}),
        ...(vuex.syncRouteParams ? {
          setRouteParams (state, params) {
            state.routeParams = params
          }
        } : {})
      },
      getters: {
        ...(vuex.syncRouteParams ? {
          localeRouteParams: ({ routeParams }) => locale => routeParams[locale] || {}
        } : {})
      }
    }, { preserveState: !!store.state[vuex.moduleName] })
  }

  const { useCookie, cookieKey, cookieDomain } = detectBrowserLanguage

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

      if (useCookie) {
        app.i18n.setLocaleCookie(newLocale)
      }
    }

    // Lazy-loading enabled
    if (lazy) {
      const { loadLanguageAsync } = require('./utils')

      // Load fallback locale.
      if (app.i18n.fallbackLocale && newLocale !== app.i18n.fallbackLocale) {
        await loadLanguageAsync(context, app.i18n.fallbackLocale)
      }

      await loadLanguageAsync(context, newLocale)
    }

    app.i18n.locale = newLocale

    await syncVuex(store, newLocale, app.i18n.getLocaleMessage(newLocale))

    const redirectPath = getRedirectPathForLocale(newLocale)

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

  const getRedirectPathForLocale = locale => {
    if (!locale || app.i18n.differentDomains || strategy === STRATEGIES.NO_PREFIX) {
      return
    }

    // Must retrieve from context as it might have changed since plugin initialization.
    const { route } = context
    const routeLocale = getLocaleFromRoute(route)

    if (routeLocale === locale) {
      return
    }

    // At this point we are left with route that either no or different locale.
    let redirectPath = app.switchLocalePath(locale)

    if (!redirectPath) {
      // Could be a 404 route in which case we should attemp to find matching route for given locale.
      redirectPath = app.localePath(route.path, locale)
    }

    return redirectPath
  }

  const doDetectBrowserLanguage = () => {
    const { alwaysRedirect, fallbackLocale } = detectBrowserLanguage

    let matchedLocale

    if (useCookie && (matchedLocale = app.i18n.getLocaleCookie())) {
      // Get preferred language from cookie if present and enabled
    } else if (process.client && typeof navigator !== 'undefined' && navigator.languages) {
      // Get browser language either from navigator if running on client side, or from the headers
      matchedLocale = matchBrowserLocale(localeCodes, navigator.languages)
    } else if (req && typeof req.headers['accept-language'] !== 'undefined') {
      matchedLocale = matchBrowserLocale(localeCodes, parseAcceptLanguage(req.headers['accept-language']))
    }

    const finalLocale = matchedLocale || fallbackLocale

    // Handle cookie option to prevent multiple redirections
    if (finalLocale && (!useCookie || alwaysRedirect || !app.i18n.getLocaleCookie())) {
      if (finalLocale !== app.i18n.locale) {
        return finalLocale
      } else if (useCookie && !app.i18n.getLocaleCookie()) {
        app.i18n.setLocaleCookie(finalLocale)
      }
    }

    return false
  }

  // Called by middleware on navigation (also on the initial one).
  const onNavigate = async () => {
    const { route } = context

    // Handle root path redirect
    if (route.path === '/' && rootRedirect) {
      let statusCode = 302
      let path = rootRedirect

      if (typeof rootRedirect !== 'string') {
        statusCode = rootRedirect.statusCode
        path = rootRedirect.path
      }

      redirect(statusCode, `/${path}`, route.query)
      return
    }

    const storedRedirect = app.i18n.__redirect
    if (storedRedirect) {
      app.i18n.__redirect = null
      redirect(storedRedirect)
      return
    }

    app.i18n.__baseUrl = resolveBaseUrl(baseUrl, context)

    const finalLocale =
      (detectBrowserLanguage && doDetectBrowserLanguage()) ||
      getLocaleFromRoute(route) || app.i18n.locale || app.i18n.defaultLocale || ''

    await app.i18n.setLocale(finalLocale)
  }

  // Set instance options
  const vueI18nOptions = typeof vueI18n === 'function' ? vueI18n(context) : vueI18n
  app.i18n = new VueI18n(vueI18nOptions)
  // Initialize locale and fallbackLocale as vue-i18n defaults those to 'en-US' if falsey
  app.i18n.locale = ''
  app.i18n.fallbackLocale = vueI18nOptions.fallbackLocale || ''
  app.i18n.locales = locales
  app.i18n.defaultLocale = defaultLocale
  app.i18n.differentDomains = differentDomains
  app.i18n.beforeLanguageSwitch = beforeLanguageSwitch
  app.i18n.onLanguageSwitched = onLanguageSwitched
  app.i18n.setLocaleCookie = locale => setLocaleCookie(locale, res, { useCookie, cookieDomain, cookieKey })
  app.i18n.getLocaleCookie = () => getLocaleCookie(req, { useCookie, cookieKey, localeCodes })
  app.i18n.setLocale = (locale) => loadAndSetLocale(locale)
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

  let finalLocale = app.i18n.defaultLocale || ''

  if (vuex && vuex.syncLocale && store && store.state[vuex.moduleName].locale !== '') {
    finalLocale = store.state[vuex.moduleName].locale
  } else if (app.i18n.differentDomains) {
    const domainLocale = getLocaleDomain(app.i18n, req)
    finalLocale = domainLocale || finalLocale
  } else if (strategy !== STRATEGIES.NO_PREFIX) {
    const routeLocale = getLocaleFromRoute(route)
    finalLocale = routeLocale || finalLocale
  } else if (useCookie) {
    finalLocale = app.i18n.getLocaleCookie() || finalLocale
  }

  const detectedBrowserLocale = detectBrowserLanguage && doDetectBrowserLanguage()
  finalLocale = detectedBrowserLocale || finalLocale
  await loadAndSetLocale(finalLocale, { initialSetup: true })
}
