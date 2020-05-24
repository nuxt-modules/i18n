export default function ({ app }) {
  const localeCodes = app.i18n.locales.map(locale => locale.code)

  // Tests localePath, switchLocalePath and getRouteBaseName from app context.
  app.allLocalePaths = localeCodes.map(locale => app.switchLocalePath(locale))
  app.routeBaseName = app.getRouteBaseName()
  app.localeRouteName = app.getLocaleRouteName(app.routeBaseName, 'fr')
}
