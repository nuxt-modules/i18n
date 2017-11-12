import middleware from './middleware'

middleware['i18n'] = function authMiddleware ({ app, store, route, error, hotReload, isServer }) {
  if (!isServer) return
  const locales = <%= options.locales %>
  const defaultLocale = '<%= options.defaultLocale %>'
  // Check if middleware called from hot-reloading, ignore
  if (hotReload) return
  // Get locale from params
  let locale = defaultLocale
  locales.forEach(l => {
    const regexp = new RegExp('^/' + l.code + '/')
    if (route.path.match(regexp)) {
      locale = l.code
    }
  })
  if (locales.findIndex(l => l.code === locale) === -1) {
    return error({ message: 'Page not found.', statusCode: 404 })
  }
  if (locale === store.state.i18n.currentLocale) return
  // Set locale
  store.dispatch('i18n/setLocale', { locale })
  app.i18n.locale = locale
}
