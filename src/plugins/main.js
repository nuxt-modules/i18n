import Vue from 'vue'
import VueI18n from 'vue-i18n'
import Cookies from 'js-cookie'
import cookie from 'cookie'


Vue.use(VueI18n)

export default async ({ app, route, store, req, res }) => {
  // Options
  const lazy = <%= options.lazy %>
  const vuex = <%= JSON.stringify(options.vuex) %>

  // Helpers
  const LOCALE_CODE_KEY = '<%= options.LOCALE_CODE_KEY %>'
  const LOCALE_DOMAIN_KEY = '<%= options.LOCALE_DOMAIN_KEY %>'
  const getLocaleCodes = <%= options.getLocaleCodes %>
  const getLocaleFromRoute = <%= options.getLocaleFromRoute %>
  const getHostname = <%= options.getHostname %>
  const getForwarded = <%= options.getForwarded %>
  const getLocaleDomain = <%= options.getLocaleDomain %>
  const syncVuex = <%= options.syncVuex %>
  const isSpa = <%= options.isSpa %>

  <% if (options.vuex) { %>
  // Register Vuex module
  if (store) {
    store.registerModule(vuex.moduleName, {
      namespaced: true,
      state: () => ({
        locale: '',
        messages: {}
      }),
      actions: {
        setLocale ({ commit }, locale) {
          commit(vuex.mutations.setLocale, locale)
        },
        setMessages ({ commit }, messages) {
          commit(vuex.mutations.setMessages, messages)
        }
      },
      mutations: {
        [vuex.mutations.setLocale] (state, locale) {
          state.locale = locale
        },
        [vuex.mutations.setMessages] (state, messages) {
          state.messages = messages
        }
      }
    })
  }
  <% } %>

  // Set instance options
  app.i18n = new VueI18n(<%= JSON.stringify(options.vueI18n) %>)
  app.i18n.locales = <%= JSON.stringify(options.locales) %>
  app.i18n.defaultLocale = '<%= options.defaultLocale %>'
  app.i18n.differentDomains = <%= options.differentDomains %>
  app.i18n.forwardedHost = <%= options.forwardedHost %>
  app.i18n.routesNameSeparator = '<%= options.routesNameSeparator %>'
  app.i18n.beforeLanguageSwitch = <%= options.beforeLanguageSwitch %>
  app.i18n.onLanguageSwitched = <%= options.onLanguageSwitched %>

  if (store && store.state.localeDomains) {
    app.i18n.locales.forEach(locale => {
      locale.domain = store.state.localeDomains[locale.code];
    })
  }

  let locale = app.i18n.defaultLocale || null
  let supportedLocales = getLocaleCodes(app.i18n.locales)

  const getCookie = (key) => {
    if (req && req.headers && typeof req.headers.cookie !== 'undefined') {
      const cookies = req.headers && req.headers.cookie ? cookie.parse(req.headers.cookie) : {}
      return cookies[key]
    } else {
      return Cookies.get(key);
    }
    return null
  }

  const setCookie = (key, val) => {
    const date = new Date()
    if (res && res.setHeader) {
      const redirectCookie = cookie.serialize(key, val, {
        expires: new Date(date.setDate(date.getDate() + 365))
      })
      res.setHeader('Set-Cookie', redirectCookie)
    } else {
      Cookies.set(key, val, {
        expires: new Date(date.setDate(date.getDate() + 365))
      })
    }
  }

  let cookieLocale = getCookie('i18n-lang')

  let browserLocale = null
  if (typeof navigator !== 'undefined' && navigator.language) {
    browserLocale = navigator.language.toLocaleLowerCase().substring(0, 2)
  } else if (req && typeof req.headers['accept-language'] !== 'undefined') {
    browserLocale = req.headers['accept-language'].split(',')[0].toLocaleLowerCase().substring(0, 2)
  }

  if(!cookieLocale) {
    if(supportedLocales.includes(browserLocale)) {
      locale = browserLocale
    }

    setCookie('i18n-lang', locale)
  } else {
    locale = cookieLocale
  }

  console.log('=== COOKIE LOCALE ===', cookieLocale)
  console.log('=== BROWSER LOCALE ===', browserLocale)
  console.log('=== LOCALE LOCALE ===', locale)
/*
  if (app.i18n.differentDomains) {
    const domainLocale = getLocaleDomain()
    locale = domainLocale ? domainLocale : locale
  } else {
    const routeLocale = getLocaleFromRoute(route, app.i18n.routesNameSeparator, app.i18n.locales)
    locale = routeLocale ? routeLocale : locale
  }*/

  app.i18n.locale = locale
  app.i18n.defaultLocale = locale

  const { loadLanguageAsync } = require('./utils')

  app.i18n.setLazyLocale = async (locale) => {
    await loadLanguageAsync(app.i18n, locale)
    app.i18n.locale = locale
    setCookie('i18n-lang', locale)
  }

  if(!req || !res) {
    store.dispatch('setLocale', locale)
  }

  // Lazy-load translations
  if (lazy) {
    const messages = await loadLanguageAsync(app.i18n, app.i18n.locale)
    syncVuex(locale, messages)
    return messages
  } else {
    // Sync Vuex
    syncVuex(locale, app.i18n.getLocaleMessage(locale))
  }
}
