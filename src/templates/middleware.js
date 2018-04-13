import cookie from 'cookie'
import middleware from '../middleware'

middleware['i18n'] = function ({ app, req, res, route, redirect, isHMR }) {
  if (isHMR) {
    return
  }

  // Helpers
  const LOCALE_CODE_KEY = '<%= options.LOCALE_CODE_KEY %>'
  const getLocaleFromRoute = <%= options.getLocaleFromRoute %>
  const getLocaleCodes = <%= options.getLocaleCodes %>
  const routesNameSeparator = '<%= options.routesNameSeparator %>'
  const locales = getLocaleCodes(<%= JSON.stringify(options.locales) %>)

  // Options
  const lazy = <%= options.lazy %>
  const differentDomains = <%= options.differentDomains %>

  let locale = app.i18n.locale || app.i18n.defaultLocale || null

  // Handle root path redirect
  const redirectRootToLocale = '<%= options.redirectRootToLocale %>'
  if (route.path === '/' && redirectRootToLocale) {
    redirect('/' + redirectRootToLocale)
  }

  // Handle browser language detection
  const detectBrowserLanguage = <%= JSON.stringify(options.detectBrowserLanguage) %>
  if (detectBrowserLanguage && req && typeof req.headers['accept-language'] !== 'undefined') {
    const browserLocale = req.headers['accept-language'] ?
      req.headers['accept-language'].split(',')[0].toLocaleLowerCase().substring(0, 2) : null
    const { useCookie, cookieKey } = detectBrowserLanguage

    const redirectToBrowserLocale = () => {
      const routeName = route && route.name ? app.getRouteBaseName(route) : 'index';
      if (browserLocale && browserLocale !== app.i18n.locale && locales.indexOf(browserLocale) !== -1) {
        locale = browserLocale
        redirect(app.localePath(Object.assign({}, route , {
          name: routeName
        })))
      }
    }

    // Handle cookie option to prevent multiple redirections
    if (useCookie) {
      const cookies = req.headers && req.headers.cookie ? cookie.parse(req.headers.cookie) : {}
      if (!cookies[cookieKey]) {
        // Set cookie
        if (useCookie && res) {
          const date = new Date()
          const redirectCookie = cookie.serialize(cookieKey, 1, {
            expires: new Date(date.setDate(date.getDate() + 365))
          })
          res.setHeader('Set-Cookie', redirectCookie)
        }
        redirectToBrowserLocale()
      }
    } else {
      redirectToBrowserLocale()
    }
  }

  // Abort if different domains option enabled
  if (app.i18n.differentDomains) {
    return
  }

  const routeLocale = getLocaleFromRoute(route, routesNameSeparator, locales)
  locale = routeLocale ? routeLocale : locale

  // Abort if locale did not change
  if (locale === app.i18n.locale) {
    return
  }

  const oldLocale = app.i18n.locale
  app.i18n.beforeLanguageSwitch(oldLocale, locale)
  // Lazy-loading enabled
  if (lazy) {
    // const { loadLanguageAsync } = require('./utils')
    // loadLanguageAsync(app.i18n, locale)
    //   .then(() => {
    //     app.i18n.locale = locale
    //     app.i18n.onLanguageSwitched(oldLocale, locale)
    //   })
  } else {
    // Lazy-loading disabled
    app.i18n.locale = locale
    app.i18n.onLanguageSwitched(oldLocale, locale)
  }
}
