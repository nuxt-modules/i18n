import cookie from 'cookie'
import Cookies from 'js-cookie'
import middleware from '../middleware'
import Vue from 'vue'

middleware['i18n'] = async ({ app, req, res, route, store, redirect, isHMR }) => {
  if (isHMR) {
    return
  }

  // Options
  const lazy = <%= options.lazy %>
  const vuex = <%= JSON.stringify(options.vuex) %>
  const differentDomains = <%= options.differentDomains %>
  const isSpa = <%= options.isSpa %>

  // Helpers
  const LOCALE_CODE_KEY = '<%= options.LOCALE_CODE_KEY %>'
  const getLocaleCodes = <%= options.getLocaleCodes %>
  const getLocaleFromRoute = <%= options.getLocaleFromRoute %>
  const routesNameSeparator = '<%= options.routesNameSeparator %>'
  const locales = getLocaleCodes(<%= JSON.stringify(options.locales) %>)
  const syncVuex = <%= options.syncVuex %>


  let locale = app.i18n.locale || app.i18n.defaultLocale || null

  // Handle root path redirect
  const rootRedirect = '<%= options.rootRedirect %>'
  if (route.path === '/' && rootRedirect) {
    redirect('/' + rootRedirect)
    return
  }

  // Handle browser language detection
  const detectBrowserLanguage = <%= JSON.stringify(options.detectBrowserLanguage) %>

  let browserLocale = null
  if (isSpa && typeof navigator !== 'undefined' && navigator.language) {
    browserLocale = navigator.language.toLocaleLowerCase().substring(0, 2)
  } else if (req && typeof req.headers['accept-language'] !== 'undefined') {
    browserLocale = req.headers['accept-language'].split(',')[0].toLocaleLowerCase().substring(0, 2)
  }

  //console.log('JE VIENS DE DETECTER LE BROWSERLOCALE 3', browserLocale, Object.keys(Vue.prototype))

  app.i18n.browserLocale = browserLocale;

  if (detectBrowserLanguage) {
    // Get browser language either from navigator if running in mode SPA, or from the headers


    if (browserLocale) {
      const { useCookie, cookieKey } = detectBrowserLanguage

      const redirectToBrowserLocale = () => {
        const routeName = route && route.name ? app.getRouteBaseName(route) : 'index'
        if (browserLocale && browserLocale !== app.i18n.locale && locales.indexOf(browserLocale) !== -1) {
          redirect(app.localePath(Object.assign({}, route , {
            name: routeName
          }), browserLocale))
        }
      }

      const getCookie = () => {
        if (isSpa) {
          return Cookies.get(cookieKey);
        } else if (req && typeof req.headers.cookie !== 'undefined') {
          const cookies = req.headers && req.headers.cookie ? cookie.parse(req.headers.cookie) : {}
          return cookies[cookieKey]
        }
        return null
      }

      const setCookie = () => {
        const date = new Date()
        if (isSpa) {
          Cookies.set(cookieKey, 1, {
            expires: new Date(date.setDate(date.getDate() + 365))
          })
        } else if (res) {
          const redirectCookie = cookie.serialize(cookieKey, 1, {
            expires: new Date(date.setDate(date.getDate() + 365))
          })
          res.setHeader('Set-Cookie', redirectCookie)
        }
      }

      // Handle cookie option to prevent multiple redirections
      if (useCookie) {
        if (!getCookie()) {
          // Set cookie
          setCookie()
          redirectToBrowserLocale()
        }
      } else {
        redirectToBrowserLocale()
      }
    }
  }

  // Abort if different domains option enabled
  if (app.i18n.differentDomains) {
    return
  }

  const routeLocale = getLocaleFromRoute(route, routesNameSeparator, locales)
  locale = routeLocale ? routeLocale : locale

  // Abort if locale did not change
  return
  if (locale === app.i18n.locale) {
  }

  const oldLocale = app.i18n.locale
  app.i18n.beforeLanguageSwitch(oldLocale, locale)
  // Lazy-loading enabled
  if (lazy) {
    const { loadLanguageAsync } = require('./utils')
    const messages = await loadLanguageAsync(app.i18n, locale)
    app.i18n.locale = locale
    app.i18n.onLanguageSwitched(oldLocale, locale)
    syncVuex(locale, messages)
  } else {
    // Lazy-loading disabled
    app.i18n.locale = locale
    app.i18n.onLanguageSwitched(oldLocale, locale)
    syncVuex(locale, app.i18n.getLocaleMessage(locale))
  }
}
