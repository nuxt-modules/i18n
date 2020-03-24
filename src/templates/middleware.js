import middleware from '../middleware'
import options from './options'
import { getLocaleFromRoute } from './utils'

middleware.nuxti18n = async (context) => {
  const { app, route, redirect, isHMR } = context

  if (isHMR) {
    return
  }

  // Handle root path redirect
  const rootRedirect = <%= JSON.stringify(options.rootRedirect) %>
  if (route.path === '/' && rootRedirect) {
    if (rootRedirect.path && rootRedirect.statusCode) {
      redirect(rootRedirect.statusCode, '/' + rootRedirect.path, route.query)
      return
    }

    redirect('/' + rootRedirect, route.query)
    return
  }

  if (options.detectBrowserLanguage && await app.i18n.__detectBrowserLanguage()) {
    return
  }

  const locale = app.i18n.locale || app.i18n.defaultLocale || null
  const routeLocale = getLocaleFromRoute(route)

  await app.i18n.setLocale(routeLocale || locale)
}
