import './middleware';
import Vue from 'vue'
import consola from 'consola'

const logger = consola.withScope('<%= options.MODULE_NAME %>')

function localePathFactory (i18nPath, routerPath) {
  return function localePath (route, locale) {
    // Abort if no route or no locale
    if (!route) return
    locale = locale || this[i18nPath].locale
    if (!locale) return

    // If route parameters is a string, use it as the route's name
    if (typeof route === 'string') {
      route = { name: route }
    }

    // Build localized route options
    const routesNameSeparator = '<%= options.routesNameSeparator %>'
    const name = route.name + routesNameSeparator + locale
    const localizedRoute = Object.assign({}, route, { name })

    // Resolve localized route
    const router = this[routerPath]
    const resolved = router.resolve(localizedRoute)
    let { href } = resolved

    // Remove baseUrl from href (will be added back by nuxt-link)
    if (router.options.base) {
      const regexp = new RegExp(router.options.base)
      href = href.replace(regexp, '/')
    }

    return href
  }
}


function switchLocalePathFactory (i18nPath) {
  return function switchLocalePath (locale) {
    const LOCALE_DOMAIN_KEY = '<%= options.LOCALE_DOMAIN_KEY %>'
    const LOCALE_CODE_KEY = '<%= options.LOCALE_CODE_KEY %>'
    const name = this.getRouteBaseName()
    if (!name) {
      return ''
    }
    const baseRoute = Object.assign({}, this.$route , { name })
    let path = this.localePath(baseRoute, locale)

    // Handle different domains
    if (this[i18nPath].differentDomains) {
      const lang = this[i18nPath].locales.find(l => l[LOCALE_CODE_KEY] === locale)
      if (lang && lang[LOCALE_DOMAIN_KEY]) {
        let protocol
        if (!process.browser) {
          const { req } = this.$options._parentVnode.ssrContext
          protocol = req.secure ? 'https' : 'http'
        } else {
          protocol = window.location.href.split(':')[0]
        }
        path = protocol + '://' + lang[LOCALE_DOMAIN_KEY] + path
      } else {
        logger.warn('Could not find domain name for locale ' + locale)
      }
    }
    return path
  }
}

function getRouteBaseNameFactory (contextRoute) {

  const routeGetter  = contextRoute ? route => route || contextRoute :
  function (route) {
    return route || this.$route
  }

  return function getRouteBaseName (route) {
    const LOCALE_CODE_KEY = '<%= options.LOCALE_CODE_KEY %>'
    const getLocaleCodes = <%= options.getLocaleCodes %>
    const routesNameSeparator = '<%= options.routesNameSeparator %>'
    route = routeGetter.call(this, route)
    if (!route.name) {
      return null
    }
    const locales = getLocaleCodes(<%= JSON.stringify(options.locales) %>)
    const regexp = new RegExp(routesNameSeparator + '(' + locales.join('|') + ')')
    return route.name.replace(regexp, '')
  }
}

Vue.mixin({
  methods: {
    localePath: localePathFactory('$i18n', '$router'),
    switchLocalePath: switchLocalePathFactory('$i18n'),
    getRouteBaseName: getRouteBaseNameFactory()
  }
})


export default ({ app, route }) => {
  app.localePath = localePathFactory('i18n', 'router')
  app.switchLocalePath = switchLocalePathFactory('i18n'),
  app.getRouteBaseName = getRouteBaseNameFactory(route)
}
