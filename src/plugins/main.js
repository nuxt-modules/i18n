import Cookie from 'cookie'
import JsCookie from 'js-cookie'
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import { nuxtI18nSeo } from './seo-head'
import {
  beforeLanguageSwitch,
  defaultLocale,
  detectBrowserLanguage,
  differentDomains,
  lazy,
  localeCodes,
  locales,
  onLanguageSwitched,
  STRATEGIES,
  strategy,
  vueI18n,
  vuex
} from './options'
import {
  getLocaleDomain,
  getLocaleFromRoute,
  isSameRoute,
  syncVuex,
  validateRouteParams
} from './utils'
import { matchBrowserLocale, parseAcceptLanguage } from './utils-common'

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

  const getLocaleCookie = () => {
    if (useCookie) {
      if (process.client) {
        return JsCookie.get(cookieKey)
      } else if (req && typeof req.headers.cookie !== 'undefined') {
        const cookies = req.headers && req.headers.cookie ? Cookie.parse(req.headers.cookie) : {}
        return cookies[cookieKey]
      }
    }
  }

  const setLocaleCookie = locale => {
    if (!useCookie) {
      return
    }
    const date = new Date()
    const cookieOptions = {
      expires: new Date(date.setDate(date.getDate() + 365)),
      path: '/',
      sameSite: 'lax'
    }

    if (cookieDomain) {
      cookieOptions.domain = cookieDomain
    }

    if (process.client) {
      JsCookie.set(cookieKey, locale, cookieOptions)
    } else if (res) {
      let headers = res.getHeader('Set-Cookie') || []
      if (typeof headers === 'string') {
        headers = [headers]
      }

      const redirectCookie = Cookie.serialize(cookieKey, locale, cookieOptions)
      headers.push(redirectCookie)

      res.setHeader('Set-Cookie', headers)
    }
  }

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

    if (!initialSetup) {
      app.i18n.onLanguageSwitched(oldLocale, newLocale)
    }

    if (!initialSetup && strategy !== STRATEGIES.NO_PREFIX) {
      const redirectPath = app.switchLocalePath(newLocale) || app.localePath('index', newLocale)
      const redirectRoute = app.router.resolve(redirectPath).route

      // Must retrieve from context as it might have changed since plugin initialization.
      const { route } = context

      if (route && !isSameRoute(route, redirectRoute)) {
        redirect(redirectPath)
      }
    }
  }

  // Set instance options
  const vueI18nOptions = typeof vueI18n === 'function' ? vueI18n(context) : vueI18n
  app.i18n = new VueI18n(vueI18nOptions)
  // Initialize locale and fallbackLocale as vue-i18n defaults those to 'en-US' if falsey
  app.i18n.locale = null
  app.i18n.fallbackLocale = vueI18nOptions.fallbackLocale || null
  app.i18n.locales = locales
  app.i18n.defaultLocale = defaultLocale
  app.i18n.differentDomains = differentDomains
  app.i18n.beforeLanguageSwitch = beforeLanguageSwitch
  app.i18n.onLanguageSwitched = onLanguageSwitched
  app.i18n.setLocaleCookie = setLocaleCookie
  app.i18n.getLocaleCookie = getLocaleCookie
  app.i18n.setLocale = (locale) => loadAndSetLocale(locale)

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

  let locale = app.i18n.defaultLocale || null

  if (app.i18n.differentDomains) {
    const domainLocale = getLocaleDomain(app.i18n, req)
    locale = domainLocale || locale
  } else if (strategy !== STRATEGIES.NO_PREFIX) {
    const routeLocale = getLocaleFromRoute(route)
    locale = routeLocale || locale
  } else if (useCookie) {
    const localeCookie = getLocaleCookie()

    if (localeCodes.includes(localeCookie)) {
      locale = localeCookie
    }
  }

  await loadAndSetLocale(locale, { initialSetup: true })

  app.i18n.__detectBrowserLanguage = async () => {
    if (detectBrowserLanguage) {
      const { alwaysRedirect, fallbackLocale } = detectBrowserLanguage

      let matchedLocale

      if (useCookie && (matchedLocale = getLocaleCookie())) {
        // Get preferred language from cookie if present and enabled
      } else if (process.client && typeof navigator !== 'undefined' && navigator.languages) {
        // Get browser language either from navigator if running on client side, or from the headers
        matchedLocale = matchBrowserLocale(localeCodes, navigator.languages)
      } else if (req && typeof req.headers['accept-language'] !== 'undefined') {
        matchedLocale = matchBrowserLocale(localeCodes, parseAcceptLanguage(req.headers['accept-language']))
      }

      matchedLocale = matchedLocale || fallbackLocale

      // Handle cookie option to prevent multiple redirections
      if (matchedLocale && (!useCookie || alwaysRedirect || !getLocaleCookie())) {
        if (matchedLocale !== app.i18n.locale) {
          await app.i18n.setLocale(matchedLocale)
          return true
        } else if (useCookie && !getLocaleCookie()) {
          app.i18n.setLocaleCookie(matchedLocale)
        }
      }
    }

    return false
  }

  await app.i18n.__detectBrowserLanguage()
}
