import './i18n.routing.middleware';
import Vue from 'vue'

Vue.mixin({
  methods: {
    getLocalizedRoute (route, locale) {
      if (!route) return
      locale = locale || this.$i18n.locale
      if (!locale) return
      // If route parameters is a string, consider it as the route's name
      if (typeof route === 'string') {
        route = { name: route }
      }
      // Build localized route options
      const name = route.name + '-' + locale
      const baseRoute = Object.assign({}, route, { name })
      // Resolve localized route
      const resolved = this.$router.resolve(baseRoute)
      let { href } = resolved
      // Handle exception for homepage
      if (route.name === 'index') {
        href += '/'
      }
      // Cleanup href
      href = (href.match(/^\/\/+$/)) ? '/' : href
      return href
    },
    getRouteBaseName (route) {
      route = route || this.$route
      if (!route.name) {
        return null
      }
      const locales = this.$store.state.i18n.locales
      for (let i = locales.length - 1; i >= 0; i--) {
        const regexp = new RegExp('-' + locales[i].code)
        if (route.name.match(regexp)) {
          return route.name.replace(regexp, '')
        }
      }
    },
    getSwitchLocaleRoute (locale) {
      const name = this.getRouteBaseName()
      if (!name) {
        return ''
      }
      const baseRoute = Object.assign({}, this.$route, { name })
      return this.getLocalizedRoute(baseRoute, locale)
    }
  }
})
