import './i18n.routing.middleware';
import Vue from 'vue'


function localePathFactory(i18nPath, routerPath) {
  return function localePath(route, locale) {
    if (!route) return
    locale = locale || this[i18nPath].locale
    if (!locale) return
    // If route parameters is a string, consider it as the route's name
    if (typeof route === 'string') {
      route = { name: route }
    }
    // Build localized route options
    const name = route.name + '-' + locale
    const baseRoute = Object.assign({}, route, { name })
    // Resolve localized router
    const resolved = this[routerPath].resolve(baseRoute)
    let { href } = resolved
    // Cleanup href
    href = (href.match(/^\/\/+$/)) ? '/' : href
    return href
  }
}


function getRouteBaseNameFactory( contextRoute ) {

  const routeGetter  = contextRoute ? route => route || contextRoute : 
  function (route) {
    return route || this.$route
  }

  return function getRouteBaseName(route) {
    route =  routeGetter.call(this, route)
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

Vue.mixin({
  methods: {
    localePath: localePathFactory('$i18n', '$router'),
    switchLocalePath(locale) {
      const name = this.getRouteBaseName()
      if (!name) {
        return ''
      }
      const baseRoute = Object.assign({}, this.$route , { name })
      return this.localePath(baseRoute, locale)
    },
    getRouteBaseName: getRouteBaseNameFactory()
  }
})


export default ({ app, route }) => {
  app.localePath = localePathFactory('i18n', 'router')
  app.getRouteBaseName = getRouteBaseNameFactory(route)
}