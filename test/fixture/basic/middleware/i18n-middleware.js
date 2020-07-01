/** @type {import('@nuxt/types').Middleware} */
const middleware = ({ app }) => {
  if (!app.i18n.locales) {
    return
  }

  const localeCodes = app.i18n.locales.map(locale => typeof (locale) === 'string' ? locale : locale.code)

  // Tests localePath, switchLocalePath and getRouteBaseName from app context.
  app.allLocalePaths = localeCodes.map(locale => app.switchLocalePath(locale))
  app.routeBaseName = app.getRouteBaseName()
  app.localizedRoute = app.localeRoute(app.routeBaseName, 'fr')
}

export default middleware
