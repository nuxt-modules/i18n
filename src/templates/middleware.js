import middleware from '../middleware'
import { detectBrowserLanguage, rootRedirect } from './options'
import { getLocaleFromRoute } from './utils'

middleware.i18n = async (context) => {
  const { app, route, redirect, isHMR } = context

  if (isHMR) {
    return
  }

  // Handle root path redirect
  if (route.path === '/' && rootRedirect) {
    redirect('/' + rootRedirect, route.query)
    return
  }

  // Update for setLocale to have up to date route
  app.i18n.__route = route

  if (detectBrowserLanguage && await app.i18n.__detectBrowserLanguage(route)) {
    return
  }

  const locale = app.i18n.locale || app.i18n.defaultLocale || null
  const routeLocale = getLocaleFromRoute(route)

  await app.i18n.setLocale(routeLocale || locale)
}
