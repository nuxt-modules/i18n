import middleware from '../middleware'
import { baseUrl, detectBrowserLanguage, rootRedirect } from './options'
import { getLocaleFromRoute } from './utils'
import { resolveBaseUrl } from './utils-common'

middleware.nuxti18n = async (context) => {
  const { app, route, redirect, isHMR } = context

  if (isHMR) {
    return
  }

  // Handle root path redirect
  if (route.path === '/' && rootRedirect) {
    let statusCode = 302
    let path = rootRedirect

    if (typeof rootRedirect !== 'string') {
      statusCode = rootRedirect.statusCode
      path = rootRedirect.path
    }

    redirect(statusCode, '/' + path, route.query)
    return
  }

  app.i18n.__baseUrl = resolveBaseUrl(baseUrl, context)

  if (detectBrowserLanguage && await app.i18n.__detectBrowserLanguage()) {
    return
  }

  const locale = app.i18n.locale || app.i18n.defaultLocale || ''
  const routeLocale = getLocaleFromRoute(route)

  await app.i18n.setLocale(routeLocale || locale)
}
