import {
  MODULE_NAME,
  STRATEGIES } from './constants'
import { extractComponentOptions } from './components'
import { getLocaleCodes } from './utils'

export const makeRoutes = (baseRoutes, {
  locales,
  defaultLocale,
  routesNameSeparator,
  strategy,
  differentDomains
}) => {
  locales = getLocaleCodes(locales)
  let localizedRoutes = []

  const buildLocalizedRoutes = (route, routeOptions = {}, isChild = false) => {
    const routes = []

    // Extract i18n options from page
    const extractedOptions = extractComponentOptions(route.component)

    // Skip route if i18n is disabled on page
    if (extractedOptions === false) {
      return route
    }

    // Component's specific options
    const componentOptions = {
      locales,
      ...extractComponentOptions(route.component),
      ...routeOptions
    }

    // Generate routes for component's supported locales
    for (let i = 0, length1 = componentOptions.locales.length; i < length1; i++) {
      const locale = componentOptions.locales[i]
      let { name, path } = route
      const localizedRoute = { ...route, children: [] }

      // Skip if locale not in module's configuration
      if (locales.indexOf(locale) === -1) {
        console.warn(`[${MODULE_NAME}] Can't generate localized route for route '${name}' with locale '${locale}' because locale is not in the module's configuration`)
        continue
      }

      // Generate localized children routes if any
      if (route.children) {
        for (let i = 0, length1 = route.children.length; i < length1; i++) {
          localizedRoute.children = localizedRoute.children.concat(buildLocalizedRoutes(route.children[i], { locales: [locale] }, true))
        }
      }

      // Get custom path if any
      if (componentOptions.paths && componentOptions.paths[locale]) {
        path = componentOptions.paths[locale]
      }

      // Make localized route name
      localizedRoute.name = name + routesNameSeparator + locale

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
    localizedRoutes = localizedRoutes.concat(buildLocalizedRoutes(route, locales))
  }

  return localizedRoutes
}
