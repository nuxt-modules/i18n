const {
  MODULE_NAME,
  STRATEGIES } = require('./constants')
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

    // Extract i18n options from page
    if (parsePages) {
      pageOptions = extractComponentOptions(route.component)
    } else {
      pageOptions = getPageOptions(route, pages, locales, pagesDir)
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
    // Double check locales to remove any locales not found in pageOptions
    // This is there to prevent children routes being localized even though
    // they are disabled in the configuration
    if (
      typeof componentOptions.locales !== 'undefined' && componentOptions.locales.length > 0 &&
      typeof pageOptions.locales !== 'undefined' && pageOptions.locales.length > 0) {
      componentOptions.locales = componentOptions.locales.filter((locale) => (
        pageOptions.locales.indexOf(locale) !== -1
      ))
    }

    // Generate routes for component's supported locales
    for (let i = 0, length1 = componentOptions.locales.length; i < length1; i++) {
      const locale = componentOptions.locales[i]
      let { name, path } = route
      const localizedRoute = { ...route }

      // Skip if locale not in module's configuration
      if (locales.indexOf(locale) === -1) {
        // eslint-disable-next-line
        console.warn(`[${MODULE_NAME}] Can't generate localized route for route '${name}' with locale '${locale}' because locale is not in the module's configuration`)
        continue
      }

      // Make localized route name
      localizedRoute.name = name + routesNameSeparator + locale

      // Generate localized children routes if any
      if (route.children) {
        delete localizedRoute.name
        localizedRoute.children = []
        for (let i = 0, length1 = route.children.length; i < length1; i++) {
          localizedRoute.children = localizedRoute.children.concat(buildLocalizedRoutes(route.children[i], { locales: [locale] }, true, isExtraRouteTree))
        }
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

          // Only routes without children have name
          if (!defaultRoute.children) {
            defaultRoute.name = localizedRoute.name + routesNameSeparator + defaultLocaleRouteNameSuffix
          } else {
            // Recreate child routes with default suffix added
            defaultRoute.children = []
            for (const childRoute of route.children) {
              // isExtraRouteTree argument is true to indicate that this is extra route added for PREFIX_AND_DEFAULT strategy
              defaultRoute.children = defaultRoute.children.concat(buildLocalizedRoutes(childRoute, { locales: [locale] }, true, true))
            }
          }

          routes.push(defaultRoute)
        } else if (isChild && isExtraRouteTree) {
          localizedRoute.name += routesNameSeparator + defaultLocaleRouteNameSuffix
        }
      }

      // Add route prefix if needed
      const shouldAddPrefix = (
        // No prefix if app uses different locale domains
        !differentDomains &&
        // Only add prefix on top level routes
        !isChild &&
        // Skip default locale if strategy is PREFIX_EXCEPT_DEFAULT
        !(locale === defaultLocale && strategy === STRATEGIES.PREFIX_EXCEPT_DEFAULT)
      )

      if (shouldAddPrefix) {
        path = `/${locale}${path}`
      }

      localizedRoute.path = path

      routes.push(localizedRoute)
    }

    return routes
  }

  for (let i = 0, length1 = baseRoutes.length; i < length1; i++) {
    const route = baseRoutes[i]
    localizedRoutes = localizedRoutes.concat(buildLocalizedRoutes(route, { locales }))
  }

  return localizedRoutes
}
