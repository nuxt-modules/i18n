/** @type {import('@nuxt/types').Middleware} */
const middleware = ({ app }) => {
  if (!app.i18n.locales) {
    return
  }

  // Tests localePath, switchLocalePath and getRouteBaseName from app context.
  app.allLocalePaths = app.i18n.localeCodes.map(locale => app.switchLocalePath(locale))
  app.routeBaseName = app.getRouteBaseName()
  app.localizedRoute = app.localeRoute(app.routeBaseName, 'fr')
  app.localizedLocation = app.localeLocation(app.routeBaseName, 'fr')
}

export default middleware
