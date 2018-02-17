import middleware from './middleware'
import { loadLanguageAsync } from './i18n.utils'

middleware['i18n'] = function ({ app, route, redirect, error, hotReload }) {
  const locales = <%= JSON.stringify(options.locales) %>
  const localeCodes = locales.map(l => l.code)
  const defaultLocale = '<%= options.defaultLocale %>'
  // Check if middleware called from hot-reloading, ignore
  if (hotReload) return
  // Handle / redirection
  if (
    route.path === '/' &&
    '<%= options.redirectRootToLocale %>' &&
    !('<%= options.redirectRootToLocale %>' === '<%= options.defaultLocale %>' && <%= options.noPrefixDefaultLocale %> === true) &&
    localeCodes.includes('<%= options.redirectRootToLocale %>')) {
    redirect('/<%= options.redirectRootToLocale %>/')
  }
  // Get locale from params
  let locale = defaultLocale
  locales.forEach(l => {
    const regexp = new RegExp('^/' + l.code + '(/.+)?')
    if (route.path.match(regexp)) {
      locale = l.code
    }
  })
  if (locales.findIndex(l => l.code === locale) === -1) {
    return error({ message: 'Page not found.', statusCode: 404 })
  }
  if (locale === app.i18n.locale) return
  if (<%= options.loadLanguagesAsync %>) {
    const langFiles = <%= JSON.stringify(options.langFiles) %>
    loadLanguageAsync(app.i18n, locale, langFiles)
      .then(() => {
        app.i18n.locale = locale
      })
  } else {
    app.i18n.locale = locale
  }
}
