import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

export default ({ app, route, error, req }) => {
  const i18n = new VueI18n(<%= JSON.stringify(options.vueI18n) %>)
  app.i18n = i18n
  app.i18n.locales = <%= JSON.stringify(options.locales) %>
  app.i18n.defaultLocale = '<%= options.defaultLocale %>'
  app.i18n.ignorePaths = <%= JSON.stringify(options.ignorePaths) %>
  app.i18n.differentDomains = <%= options.differentDomains %>
  app.i18n.beforeLanguageSwitch = <%= options.beforeLanguageSwitch %>
  app.i18n.onLanguageSwitched = <%= options.onLanguageSwitched %>

  // Get locale from params
  let locale = app.i18n.defaultLocale || null
  if (<%= options.differentDomains %>) {
    const hostname = process.browser ?
      window.location.href.split('/')[2] : req.headers.host
    if (hostname) {
      const localeDomain = app.i18n.locales.find(l => l.domain === hostname)
      if (localeDomain) {
        locale = localeDomain.code
      }
    }
  } else {
    // Get locale from params
    app.i18n.locales.forEach(l => {
      const regexp = new RegExp('^/' + l.code + '(/.+)?')
      if (route.path.match(regexp)) {
        locale = l.code
      }
    })
    if (app.i18n.locales.findIndex(l => l.code === locale) === -1) {
      return error({ message: 'Page not found.', statusCode: 404 })
    }
  }
  app.i18n.locale = locale
  if (<%= options.loadLanguagesAsync %>) {
    const { loadLanguageAsync } = require('./i18n.utils')
    return loadLanguageAsync(app.i18n, app.i18n.locale)
  }
}
