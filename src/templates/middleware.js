import middleware from '../middleware'

middleware['i18n'] = async (context) => {
  const { app, req, route, redirect, isHMR } = context

  if (isHMR) {
    return
  }

  // Helpers
  const LOCALE_CODE_KEY = '<%= options.LOCALE_CODE_KEY %>'
  const getLocaleCodes = <%= options.getLocaleCodes %>

  // Handle root path redirect
  const rootRedirect = '<%= options.rootRedirect %>'
  if (route.path === '/' && rootRedirect) {
    redirect('/' + rootRedirect, route.query)
    return
  }

  // Update for setLocale to have up to date route
  app.i18n.__route = route

  const detectBrowserLanguage = <%= JSON.stringify(options.detectBrowserLanguage) %>

  if (detectBrowserLanguage && await app.i18n.__detectBrowserLanguage(route)) {
    return
  }

  const locale = app.i18n.locale || app.i18n.defaultLocale || null
  const getLocaleFromRoute = <%= options.getLocaleFromRoute %>
  const routesNameSeparator = '<%= options.routesNameSeparator %>'
  const defaultLocaleRouteNameSuffix = '<%= options.defaultLocaleRouteNameSuffix %>'
  const locales = getLocaleCodes(<%= JSON.stringify(options.locales) %>)

  const routeLocale = getLocaleFromRoute(route, routesNameSeparator, defaultLocaleRouteNameSuffix, locales)

  await app.i18n.setLocale(routeLocale ? routeLocale : locale)
}
