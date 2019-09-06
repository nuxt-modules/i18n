import './middleware'
import Vue from 'vue'

const STRATEGIES = <%= JSON.stringify(options.STRATEGIES) %>
const STRATEGY = '<%= options.strategy %>'
const vuex = <%= JSON.stringify(options.vuex) %>
const routesNameSeparator = '<%= options.routesNameSeparator %>'
const defaultLocale = '<%= options.defaultLocale %>'

function localePathFactory (i18nPath, routerPath) {
  const defaultLocaleRouteNameSuffix = '<%= options.defaultLocaleRouteNameSuffix %>'

  return function localePath (route, locale) {
    // Abort if no route or no locale
    if (!route) return

    if (STRATEGY === STRATEGIES.NO_PREFIX && locale && locale !== this[i18nPath].locale) {
      console.warn('[<%= options.MODULE_NAME %>] Passing non-current locale to localePath is unsupported when using no_prefix strategy')
    }

    locale = locale || this[i18nPath].locale

    if (!locale) return

    // If route parameters is a string, use it as the route's name
    if (typeof route === 'string') {
      route = { name: route }
    }

    let localizedRoute
    const router = this[routerPath]

    if (route.path && !route.name) {
      // if route has a path defined but no name, resolve full route using the path
      const isPrefixed = (
        // don't prefix default locale
        !(locale === defaultLocale && STRATEGY === STRATEGIES.PREFIX_EXCEPT_DEFAULT) &&
        // no prefix for any language
        !(STRATEGY === STRATEGIES.NO_REFIX) &&
        // no prefix for different domains
        !this[i18nPath].differentDomains
      )

      const path = (isPrefixed ? `/${locale}${route.path}` : route.path)

      localizedRoute = Object.assign({}, route, { path })
    } else {
      // otherwise resolve route via the route name
      // Build localized route options
      let name = route.name + (STRATEGY === STRATEGIES.NO_PREFIX ? '' : routesNameSeparator + locale)

      // Match route without prefix for default locale
      if (locale === defaultLocale && STRATEGY === STRATEGIES.PREFIX_AND_DEFAULT) {
        name += routesNameSeparator + defaultLocaleRouteNameSuffix
      }

      localizedRoute = Object.assign({}, route, { name })

      const { params } = localizedRoute
      if (params && params['0'] === undefined && params.pathMatch) {
        params['0'] = params.pathMatch
      }
    }

    // Resolve localized route
    const { route: { fullPath } } = router.resolve(localizedRoute)
    return fullPath
  }
}


function switchLocalePathFactory (i18nPath) {
  const LOCALE_DOMAIN_KEY = '<%= options.LOCALE_DOMAIN_KEY %>'
  const LOCALE_CODE_KEY = '<%= options.LOCALE_CODE_KEY %>'

  return function switchLocalePath (locale) {
    if (STRATEGY === STRATEGIES.NO_PREFIX && locale && locale !== this[i18nPath].locale) {
      console.warn('[<%= options.MODULE_NAME %>] Passing non-current locale to switchLocalePath is unsupported when using no_prefix strategy')
    }

    const name = this.getRouteBaseName()
    if (!name) {
      return ''
    }

    const { params, ...routeCopy } = this.$route
    let langSwitchParams = {}
    <% if (options.vuex) { %>
    if (this.$store) {
      langSwitchParams = this.$store.getters[`${vuex.moduleName}/localeRouteParams`](locale)
    }
    <% } %>
    const baseRoute = Object.assign({}, routeCopy, {
      name,
      params: {
        ...params,
        ...langSwitchParams,
        '0': params.pathMatch
      }
    })
    let path = this.localePath(baseRoute, locale)

    // Handle different domains
    if (this[i18nPath].differentDomains) {
      const lang = this[i18nPath].locales.find(l => l[LOCALE_CODE_KEY] === locale)
      if (lang && lang[LOCALE_DOMAIN_KEY]) {
        let protocol
        if (process.server) {
          const isHTTPS = require('is-https');
          const { req } = this.$options._parentVnode.ssrContext
          protocol = isHTTPS(req) ? 'https' : 'http'
        } else {
          protocol = window.location.protocol.split(':')[0]
        }
        path = protocol + '://' + lang[LOCALE_DOMAIN_KEY] + path
      } else {
        console.warn('[<%= options.MODULE_NAME %>] Could not find domain name for locale ' + locale)
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
    route = routeGetter.call(this, route)
    if (!route.name) {
      return null
    }
    return route.name.split(routesNameSeparator)[0]
  }
}

const plugin = {
  install(Vue) {
    Vue.mixin({
      methods: {
        localePath: localePathFactory('$i18n', '$router'),
        switchLocalePath: switchLocalePathFactory('$i18n'),
        getRouteBaseName: getRouteBaseNameFactory()
      }
    })
  }
}

export default ({ app, route }) => {
  Vue.use(plugin)
  app.localePath = localePathFactory('i18n', 'router')
  app.switchLocalePath = switchLocalePathFactory('i18n')
  app.getRouteBaseName = getRouteBaseNameFactory(route)
}
