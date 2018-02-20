import Vue from 'vue'
import VueI18n from 'vue-i18n'
import { loadLanguageAsync } from './i18n.utils'

Vue.use(VueI18n)

export default ({ app, route, error }) => {
  const i18n = new VueI18n(<%= JSON.stringify(options.vueI18n) %>)
  app.i18n = i18n
  app.i18n.locales = <%= JSON.stringify(options.locales) %>
  app.i18n.defaultLocale = '<%= options.defaultLocale %>'
  app.i18n.ignorePaths = <%= JSON.stringify(options.ignorePaths) %>

  // Get locale from params
  let locale = app.i18n.defaultLocale || null
  app.i18n.locales.forEach(l => {
    const regexp = new RegExp('^/' + l.code + '(/.+)?')
    if (route.path.match(regexp)) {
      locale = l.code
    }
  })
  if (app.i18n.locales.findIndex(l => l.code === locale) === -1) {
    return error({ message: 'Page not found.', statusCode: 404 })
  }
  app.i18n.locale = locale
  if (<%= options.loadLanguagesAsync %>) {
    loadLanguageAsync(app.i18n, app.i18n.locale)
  }
}
