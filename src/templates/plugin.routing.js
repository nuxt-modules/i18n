import './middleware'
import Vue from 'vue'
import { withoutTrailingSlash, withTrailingSlash } from '~i18n-ufo'
import { Constants, nuxtOptions, options } from './options'
import { getDomainFromLocale } from './plugin.utils'

/**
 * @this {import('../../types/internal').PluginProxy}
 * @type {Vue['localePath']}
 */
function localePath (route, locale) {
  const localizedRoute = resolveRoute.call(this, route, locale)
  return localizedRoute ? localizedRoute.route.redirectedFrom || localizedRoute.route.fullPath : ''
}

/**
 * @this {import('../../types/internal').PluginProxy}
 * @type {Vue['localeRoute']}
 */
function localeRoute (route, locale) {
  const resolved = resolveRoute.call(this, route, locale)
  return resolved ? resolved.route : undefined
}

/**
 * @this {import('../../types/internal').PluginProxy}
 * @type {Vue['localeLocation']}
 */
function localeLocation (route, locale) {
  const resolved = resolveRoute.call(this, route, locale)
  return resolved ? resolved.location : undefined
}

/**
 * @this {import('../../types/internal').PluginProxy}
 * @param {import('vue-router').RawLocation} route
 * @param {string} [locale]
 * @return {ReturnType<import('vue-router').default['resolve']> | undefined}
 */
function resolveRoute (route, locale) {
  // Abort if no route or no locale
  if (!route) {
    return
  }

  const { i18n } = this

  locale = locale || i18n.locale

  if (!locale) {
    return
  }

  // If route parameter is a string, check if it's a path or name of route.
  if (typeof route === 'string') {
    if (route[0] === '/') {
      // If route parameter is a path, create route object with path.
      route = { path: route }
    } else {
      // Else use it as route name.
      route = { name: route }
    }
  }

  let localizedRoute = Object.assign({}, route)

  if (localizedRoute.path && !localizedRoute.name) {
    const resolvedRoute = this.router.resolve(localizedRoute).route
    const resolvedRouteName = this.getRouteBaseName(resolvedRoute)
    if (resolvedRouteName) {
      localizedRoute = {
        name: getLocaleRouteName(resolvedRouteName, locale),
        params: resolvedRoute.params,
        query: resolvedRoute.query,
        hash: resolvedRoute.hash
      }
    } else {
      const isDefaultLocale = locale === options.defaultLocale
      // if route has a path defined but no name, resolve full route using the path
      const isPrefixed =
          // don't prefix default locale
          !(isDefaultLocale && [Constants.STRATEGIES.PREFIX_EXCEPT_DEFAULT, Constants.STRATEGIES.PREFIX_AND_DEFAULT].includes(options.strategy)) &&
          // no prefix for any language
          !(options.strategy === Constants.STRATEGIES.NO_PREFIX) &&
          // no prefix for different domains
          !i18n.differentDomains
      if (isPrefixed) {
        localizedRoute.path = `/${locale}${localizedRoute.path}`
      }
      localizedRoute.path = nuxtOptions.trailingSlash ? withTrailingSlash(localizedRoute.path, true) : withoutTrailingSlash(localizedRoute.path, true)
    }
  } else {
    if (!localizedRoute.name && !localizedRoute.path) {
      localizedRoute.name = this.getRouteBaseName()
    }

    localizedRoute.name = getLocaleRouteName(localizedRoute.name, locale)

    const { params } = localizedRoute
    if (params && params['0'] === undefined && params.pathMatch) {
      params['0'] = params.pathMatch
    }
  }

  const resolvedRoute = this.router.resolve(localizedRoute)
  if (resolvedRoute.route.name) {
    return resolvedRoute
  }
  // If didn't resolve to an existing route then just return resolved route based on original input.
  return this.router.resolve(route)
}

/**
 * @this {import('../../types/internal').PluginProxy}
 * @type {Vue['switchLocalePath']}
 */
function switchLocalePath (locale) {
  const name = this.getRouteBaseName()
  if (!name) {
    return ''
  }

  const { i18n, route, store } = this
  const { params, ...routeCopy } = route
  let langSwitchParams = {}
  if (options.vuex && options.vuex.syncRouteParams && store) {
    langSwitchParams = store.getters[`${options.vuex.moduleName}/localeRouteParams`](locale)
  }
  const baseRoute = Object.assign({}, routeCopy, {
    name,
    params: {
      ...params,
      ...langSwitchParams,
      0: params.pathMatch
    }
  })
  let path = this.localePath(baseRoute, locale)

  // Handle different domains
  if (i18n.differentDomains) {
    const getDomainOptions = {
      differentDomains: i18n.differentDomains,
      normalizedLocales: options.normalizedLocales
    }
    const domain = getDomainFromLocale(locale, this.req, getDomainOptions)
    if (domain) {
      path = domain + path
    }
  }

  return path
}

/**
 * @this {import('../../types/internal').PluginProxy}
 * @type {Vue['getRouteBaseName']}
 */
function getRouteBaseName (givenRoute) {
  const route = givenRoute !== undefined ? givenRoute : this.route
  if (!route || !route.name) {
    return
  }
  return route.name.split(options.routesNameSeparator)[0]
}

/**
 * @param {string | undefined} routeName
 * @param {string} locale
 */
function getLocaleRouteName (routeName, locale) {
  let name = routeName + (options.strategy === Constants.STRATEGIES.NO_PREFIX ? '' : options.routesNameSeparator + locale)

  if (locale === options.defaultLocale && options.strategy === Constants.STRATEGIES.PREFIX_AND_DEFAULT) {
    name += options.routesNameSeparator + options.defaultLocaleRouteNameSuffix
  }

  return name
}

/**
 * @template {(...args: any[]) => any} T
 * @param {T} targetFunction
 * @return {(this: Vue, ...args: Parameters<T>) => ReturnType<T>}
 */
const VueInstanceProxy = function (targetFunction) {
  return function () {
    const proxy = {
      getRouteBaseName: this.getRouteBaseName,
      i18n: this.$i18n,
      localePath: this.localePath,
      localeRoute: this.localeRoute,
      localeLocation: this.localeLocation,
      // @ts-ignore
      req: process.server ? this.$root.context?.req || this.$ssrContext?.req : null,
      route: this.$route,
      router: this.$router,
      store: this.$store
    }

    return targetFunction.call(proxy, ...arguments)
  }
}

/**
 * @template {(...args: any[]) => any} T
 * @param {import('@nuxt/types').Context} context
 * @param {T} targetFunction
 * @return {(...args: Parameters<T>) => ReturnType<T>}
 */
const NuxtContextProxy = function (context, targetFunction) {
  return function () {
    const { app, req, route, store } = context

    const proxy = {
      getRouteBaseName: app.getRouteBaseName,
      i18n: app.i18n,
      localePath: app.localePath,
      localeLocation: app.localeLocation,
      localeRoute: app.localeRoute,
      req: process.server ? req : null,
      route,
      router: app.router,
      store
    }

    return targetFunction.call(proxy, ...arguments)
  }
}

/** @type {import('vue').PluginObject<void>} */
const plugin = {
  install (Vue) {
    Vue.mixin({
      methods: {
        localePath: VueInstanceProxy(localePath),
        localeRoute: VueInstanceProxy(localeRoute),
        localeLocation: VueInstanceProxy(localeLocation),
        switchLocalePath: VueInstanceProxy(switchLocalePath),
        getRouteBaseName: VueInstanceProxy(getRouteBaseName)
      }
    })
  }
}

/** @type {import('@nuxt/types').Plugin} */
export default (context) => {
  Vue.use(plugin)
  const { app, store } = context

  app.localePath = context.localePath = NuxtContextProxy(context, localePath)
  app.localeRoute = context.localeRoute = NuxtContextProxy(context, localeRoute)
  app.localeLocation = context.localeLocation = NuxtContextProxy(context, localeLocation)
  app.switchLocalePath = context.switchLocalePath = NuxtContextProxy(context, switchLocalePath)
  app.getRouteBaseName = context.getRouteBaseName = NuxtContextProxy(context, getRouteBaseName)

  if (store) {
    store.localePath = app.localePath
    store.localeRoute = app.localeRoute
    store.localeLocation = app.localeLocation
    store.switchLocalePath = app.switchLocalePath
    store.getRouteBaseName = app.getRouteBaseName
  }
}
