import Cookie from 'cookie'
import JsCookie from 'js-cookie'
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import { nuxtI18nSeo } from './seo-head'

Vue.use(VueI18n)

export default async (context) => {
  const { app, route, store, req, res } = context;

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
    }, { preserveState: vuex.preserveState })
  }
  <% } %>

  const detectBrowserLanguage = <%= JSON.stringify(options.detectBrowserLanguage) %>
  const { useCookie, cookieKey } = detectBrowserLanguage

  const setLocaleCookie = locale => {
    if (!useCookie) {
      return;
    }
    const date = new Date()
    if (process.client) {
      JsCookie.set(cookieKey, locale, {
        expires: new Date(date.setDate(date.getDate() + 365)),
        path: '/'
      })
    } else if (res) {
      let headers = res.getHeader('Set-Cookie') || []
      if (typeof headers == 'string') {
        headers = [headers]
      }

      const redirectCookie = Cookie.serialize(cookieKey, locale, {
        expires: new Date(date.setDate(date.getDate() + 365)),
        path: '/'
      })
      headers.push(redirectCookie)

      res.setHeader('Set-Cookie', headers)
    }
  }

  // Set instance options
  app.i18n = new VueI18n(<%= JSON.stringify(options.vueI18n) %>)
  app.i18n.locales = <%= JSON.stringify(options.locales) %>
  app.i18n.defaultLocale = '<%= options.defaultLocale %>'
  app.i18n.differentDomains = <%= options.differentDomains %>
  app.i18n.forwardedHost = <%= options.forwardedHost %>
  app.i18n.beforeLanguageSwitch = <%= options.beforeLanguageSwitch %>
  app.i18n.onLanguageSwitched = <%= options.onLanguageSwitched %>
  app.i18n.setLocaleCookie = setLocaleCookie
  // Extension of Vue
  if (!app.$t) {
    app.$t = app.i18n.t
  }

  // Inject seo function
  Vue.prototype.$nuxtI18nSeo = nuxtI18nSeo

  if (store && store.state.localeDomains) {
    app.i18n.locales.forEach(locale => {
      locale.domain = store.state.localeDomains[locale.code]
    })
  }

  let locale = app.i18n.defaultLocale || null

  if (app.i18n.differentDomains) {
    const domainLocale = getLocaleDomain()
    locale = domainLocale ? domainLocale : locale
  } else {
    const routesNameSeparator = '<%= options.routesNameSeparator %>'
    const defaultLocaleRouteNameSuffix = '<%= options.defaultLocaleRouteNameSuffix %>'

    const routeLocale = getLocaleFromRoute(route, routesNameSeparator, defaultLocaleRouteNameSuffix, app.i18n.locales)
    locale = routeLocale ? routeLocale : locale
  }

  app.i18n.locale = locale

  // Lazy-load translations
  if (lazy) {
    const { loadLanguageAsync } = require('./utils')

    // Load fallback locale.
    if (app.i18n.fallbackLocale && app.i18n.locale !== app.i18n.fallbackLocale) {
      await loadLanguageAsync(context, app.i18n.fallbackLocale)
    }

    const messages = await loadLanguageAsync(context, app.i18n.locale)
    await syncVuex(locale, messages)
    return messages
  } else {
    // Sync Vuex
    await syncVuex(locale, app.i18n.getLocaleMessage(locale))
  }
}
