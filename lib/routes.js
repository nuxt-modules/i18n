const { has } = require('lodash')
const { isIgnoredPath } = require('./templates/i18n.routes.utils')

/**
 * Generate localized route using Nuxt's generated routes and i18n config
 * @param  {Array}  baseRoutes  Nuxt's default routes based on pages/ directory
 * @param  {Array}  locales     Locales to use for route generation, should be
 *                              used when recursively generating children routes,
 *                              defaults to app's configured LOCALES
 * @return {Array}              Localized routes to be used in Nuxt config
 */
const generateRoutes = ({
  baseRoutes,
  locales,
  defaultLocale,
  routesOptions,
  noPrefixDefaultLocale = true,
  differentDomains = false,
  ignorePaths = [],
  isChild = false
}) => {
  // Abort routes generation if no routes or locales specified
  if (!baseRoutes || !locales) {
    return []
  }
  const newRoutes = []
  const localizedRoutes = []
  // Extract routes that should not be localized
  baseRoutes.forEach(route => {
    if (isIgnoredPath(route, ignorePaths)) {
      newRoutes.push(route)
    } else {
      localizedRoutes.push(route)
    }
  })

  localizedRoutes.forEach(baseRoute => {
    locales.forEach((locale) => {
      const { component, chunkName } = baseRoute
      let { path, name, children } = baseRoute
      const cleanChunkName = chunkName ? chunkName.replace(/^pages\//, '') : name
      if (children) {
        children = generateRoutes({
          baseRoutes: children,
          locales: [locale],
          defaultLocale,
          routesOptions,
          ignorePaths,
          isChild: true
        })
      }
      const { code } = locale
      if (has(routesOptions, `${cleanChunkName}.${code}`)) {
        path = routesOptions[cleanChunkName][code]
      }
      // Don't change path when current route is a child
      if (!isChild) {
        // Add leading / if needed
        if (path.match(/^\//) === null) {
          path = `/${path}`
        }
        if (!differentDomains && (code !== defaultLocale || !noPrefixDefaultLocale)) {
          // Prefix path with locale code if not default locale
          path = `/${code}${path}`
        }
        if (cleanChunkName === 'index' && path !== '/' && path.match(/\/$/) !== null) {
          path = path.replace(/\/$/, '')
        }
      }
      const route = { path, component }
      if (name) {
        name += `-${code}`
        route.name = name
      }
      if (children) {
        route.children = children
      }
      newRoutes.push(route)
    })
  })
  return newRoutes
}

module.exports = { generateRoutes }
