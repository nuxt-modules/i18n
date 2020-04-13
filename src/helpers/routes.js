const { STRATEGIES } = require('./constants')
const { extractComponentOptions } = require('./components')
const { getPageOptions, getLocaleCodes } = require('./utils')

exports.makeRoutes = (baseRoutes, {
  locales,
  defaultLocale,
  routesNameSeparator,
  defaultLocaleRouteNameSuffix,
  strategy,
  parsePages,
  pages,
  encodePaths,
  pagesDir,
  differentDomains
}) => {
  locales = getLocaleCodes(locales)
  let localizedRoutes = []

  const buildLocalizedRoutes = (route, routeOptions = {}, isChild = false, isExtraRouteTree = false) => {
    const routes = []
    let pageOptions

    // Skip route if it is only a redirect without a component.
    if (route.redirect && !route.component) {
      return route
    }

    // Extract i18n options from page
    if (parsePages) {
      pageOptions = extractComponentOptions(route.component)
    } else {
      pageOptions = getPageOptions(route, pages, locales, pagesDir, defaultLocale)
    }

    // Skip route if i18n is disabled on page
    if (pageOptions === false) {
      return route
    }

    // Component's specific options
    const componentOptions = {
      locales,
      ...pageOptions,
      ...routeOptions
    }

    // Detects if the route is for a specific locale (i.e. ends with '.xx', which xx is the iso code for a locale)
    const localeInPathIndex = locales.findIndex(l => route.path.endsWith('.' + l))
    let specificLocale
    if (localeInPathIndex !== -1) {
      specificLocale = locales[localeInPathIndex]

      // Locales will be limited to the specified one
      componentOptions.locales = [specificLocale]
    }

    // Double check locales to remove any locales not found in pageOptions
    // This is there to prevent children routes being localized even though
    // they are disabled in the configuration
    if (
      typeof componentOptions.locales !== 'undefined' && componentOptions.locales.length > 0 &&
      typeof pageOptions.locales !== 'undefined' && pageOptions.locales.length > 0) {
      componentOptions.locales = componentOptions.locales.filter((locale) => pageOptions.locales.includes(locale))
    }

    // Generate routes for component's supported locales
    for (let i = 0, length1 = componentOptions.locales.length; i < length1; i++) {
      const locale = componentOptions.locales[i]
      const { name } = route
      let { path } = route
      const localizedRoute = { ...route }

      // Remove the suffix '.xx' from the route
      if (specificLocale) {
        path = path.replace(new RegExp('\\.' + specificLocale + '$'), '')
      }

      // Make localized route name. Name might not exist on parent route if child has same path.
      if (name) {
        localizedRoute.name = name + routesNameSeparator + locale
      }

      // Generate localized children routes if any
      if (route.children) {
        localizedRoute.children = []
        for (let i = 0, length1 = route.children.length; i < length1; i++) {
          localizedRoute.children = localizedRoute.children.concat(buildLocalizedRoutes(route.children[i], { locales: [locale] }, true, isExtraRouteTree))
        }
        // Remove duplicates normal routes overriding specific ones
        localizedRoute.children = removeDuplicatesOfSpecificRoutes(localizedRoute.children)
      }

      // Get custom path if any
      if (componentOptions.paths && componentOptions.paths[locale]) {
        path = encodePaths ? encodeURI(componentOptions.paths[locale]) : componentOptions.paths[locale]
      }

      // For PREFIX_AND_DEFAULT strategy and default locale:
      // - if it's a parent route, add it with default locale suffix added (no suffix if route has children)
      // - if it's a child route of that extra parent route, append default suffix to it
      if (locale === defaultLocale && strategy === STRATEGIES.PREFIX_AND_DEFAULT) {
        if (!isChild) {
          const defaultRoute = { ...localizedRoute, path }

          if (name) {
            defaultRoute.name = localizedRoute.name + routesNameSeparator + defaultLocaleRouteNameSuffix
          }

          if (defaultRoute.children) {
            // Recreate child routes with default suffix added
            defaultRoute.children = []
            for (const childRoute of route.children) {
              // isExtraRouteTree argument is true to indicate that this is extra route added for PREFIX_AND_DEFAULT strategy
              defaultRoute.children = defaultRoute.children.concat(buildLocalizedRoutes(childRoute, { locales: [locale] }, true, true))
            }
            // Remove duplicates normal routes overriding specific ones
            defaultRoute.children = removeDuplicatesOfSpecificRoutes(defaultRoute.children)
          }

          routes.push(defaultRoute)
        } else if (isChild && isExtraRouteTree && name) {
          localizedRoute.name += routesNameSeparator + defaultLocaleRouteNameSuffix
        }
      }

      const isChildWithRelativePath = isChild && !path.startsWith('/')

      // Add route prefix if needed
      const shouldAddPrefix = (
        // No prefix if app uses different locale domains
        !differentDomains &&
        // No need to add prefix if child's path is relative
        !isChildWithRelativePath &&
        // Skip default locale if strategy is PREFIX_EXCEPT_DEFAULT
        !(locale === defaultLocale && strategy === STRATEGIES.PREFIX_EXCEPT_DEFAULT)
      )

      if (shouldAddPrefix) {
        path = `/${locale}${path}`
      }

      localizedRoute.path = path

      // Flag the route to be detectable when checking for duplicates
      localizedRoute.isSpecificForLocale = !!specificLocale

      routes.push(localizedRoute)
    }

    return routes
  }

  for (let i = 0, length1 = baseRoutes.length; i < length1; i++) {
    const route = baseRoutes[i]
    localizedRoutes = localizedRoutes.concat(buildLocalizedRoutes(route, { locales }))
  }
  // Remove duplicates normal routes overriding specific ones
  localizedRoutes = removeDuplicatesOfSpecificRoutes(localizedRoutes)

  try {
    const { sortRoutes } = require('@nuxt/utils')
    localizedRoutes = sortRoutes(localizedRoutes)
  } catch (error) {
    // Ignore
  }

  return localizedRoutes
}

/**
 * When specific routes are added, non-specific ones are still there,
 * so we have to remove them to avoid specific routes from being overriden.
 * @param {*} routes All routes, returned from buildLocalizedRoutes
 */
function removeDuplicatesOfSpecificRoutes (routes) {
  routes.filter(r => r.isSpecificForLocale).forEach((route) => {
    const duplicateIndex = routes.findIndex(r => r.path === route.path && !r.isSpecificForLocale)
    if (duplicateIndex !== -1) {
      routes.splice(duplicateIndex, 1)
    }
  })

  return routes
}
