import Vue from 'vue'
import VueI18n from 'vue-i18n'

import i18nStore from './i18n.store'

Vue.use(VueI18n)

export default ({ app, store, route, isClient, hotReload }) => {
  store.registerModule('i18n', i18nStore)
  const i18n = new VueI18n({
    <% if (options.fallbackLocale) { %>fallbackLocale: '<%= options.fallbackLocale %>',<% } %>
    <% if (options.messages) { %>messages: <%= options.messages %><% } %>
  })
  i18n.locale = store.state.i18n.currentLocale
  app.i18n = i18n
  // Check locale in URL (same as middleware but exclusive to client)
  if (isClient) {
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
}
