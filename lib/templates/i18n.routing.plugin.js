import './i18n.routing.middleware';
import Vue from 'vue'

Vue.mixin({
  methods: {
    localePath (route, locale) {
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
      // Handle homepage exception
      if (route.name === 'index') {
        href = route.hash
          ? href.replace('#', '/#')
          : href + '/'
      }
      // Cleanup href
      href = (href.match(/^\/\/+$/)) ? '/' : href
      return href
    },
    switchLocalePath (locale) {
      const name = this.getRouteBaseName()
      if (!name) {
        return ''
      }
      const baseRoute = Object.assign({}, this.$route, { name })
      return this.localePath(baseRoute, locale)
    },
    getRouteBaseName (route) {
      route = route || this.$route
      if (!route.name) {
        return null
      }
      const locales = <%= JSON.stringify(options.locales) %>
      for (let i = locales.length - 1; i >= 0; i--) {
        const regexp = new RegExp('-' + locales[i].code)
        if (route.name.match(regexp)) {
          return route.name.replace(regexp, '')
        }
      }
    }
  }
})
