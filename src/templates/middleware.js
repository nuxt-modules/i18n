import Cookie from 'cookie'
import JsCookie from 'js-cookie'
import middleware from '../middleware'

middleware['i18n'] = async (context) => {
  const { app, req, route, store, redirect, isHMR } = context;

  if (isHMR) {
    return
  }

  // Options
  const STRATEGIES = <%= JSON.stringify(options.STRATEGIES) %>
  const STRATEGY = '<%= options.strategy %>'
  const lazy = <%= options.lazy %>
  const vuex = <%= JSON.stringify(options.vuex) %>
  const differentDomains = <%= options.differentDomains %>

  // Helpers
  const LOCALE_CODE_KEY = '<%= options.LOCALE_CODE_KEY %>'
  const getLocaleCodes = <%= options.getLocaleCodes %>
  const getLocaleFromRoute = <%= options.getLocaleFromRoute %>
  const routesNameSeparator = '<%= options.routesNameSeparator %>'
  const defaultLocaleRouteNameSuffix = '<%= options.defaultLocaleRouteNameSuffix %>'
  const locales = getLocaleCodes(<%= JSON.stringify(options.locales) %>)
  const syncVuex = <%= options.syncVuex %>

  let locale = app.i18n.locale || app.i18n.defaultLocale || null

  // Handle root path redirect
  const rootRedirect = '<%= options.rootRedirect %>'
  if (route.path === '/' && rootRedirect) {
    redirect('/' + rootRedirect, route.query)
    return
  }

  // Update for setLocale to have up to date route
  app.i18n.__route = route

  // Handle browser language detection
  const detectBrowserLanguage = <%= JSON.stringify(options.detectBrowserLanguage) %>
  const routeLocale = getLocaleFromRoute(route, routesNameSeparator, defaultLocaleRouteNameSuffix, locales)

  const { useCookie, cookieKey, alwaysRedirect, fallbackLocale } = detectBrowserLanguage
  const { getLocaleCookie } = app.i18n

  if (detectBrowserLanguage) {
    let browserLocale

    if (useCookie && (browserLocale = getLocaleCookie()) && browserLocale !== 1 && browserLocale !== '1') {
      // Get preferred language from cookie if present and enabled
      // Exclude 1 for backwards compatibility and fallback when fallbackLocale is empty
    } else if (process.client && typeof navigator !== 'undefined' && navigator.language) {
      // Get browser language either from navigator if running on client side, or from the headers
      browserLocale = navigator.language.toLocaleLowerCase().substring(0, 2)
    } else if (req && typeof req.headers['accept-language'] !== 'undefined') {
      browserLocale = req.headers['accept-language'].split(',')[0].toLocaleLowerCase().substring(0, 2)
    }

    if (browserLocale) {
      // Handle cookie option to prevent multiple redirections
      if (!useCookie || alwaysRedirect || !getLocaleCookie()) {
        let redirectToLocale = fallbackLocale

        // Use browserLocale if we support it, otherwise use fallbackLocale
        if (locales.includes(browserLocale)) {
          redirectToLocale = browserLocale
        }

        if (redirectToLocale && locales.includes(redirectToLocale)) {
          if (redirectToLocale !== app.i18n.locale) {
            // We switch the locale before redirect to prevent loops
            await app.i18n.setLocale(redirectToLocale)
          }
        } else if (useCookie && !getLocaleCookie()) {
          app.i18n.setLocaleCookie(redirectToLocale)
        }

        return
      }
    }
  }

  await app.i18n.setLocale(routeLocale ? routeLocale : locale)
}
