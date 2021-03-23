/**
 * @typedef {import('../../types/internal').ResolvedOptions} ResolvedOptions
 */

/**
 * Retrieve page's options from the module's configuration for a given route
 *
 * @typedef {{ locales: readonly string[], paths: Record<string, string>} } ComputedPageOptions
 *
 * @param {import('@nuxt/types/config/router').NuxtRouteConfig} route
 * @param {ResolvedOptions['pages']} pages Pages options from module's configuration
 * @param {ResolvedOptions['localeCodes']} localeCodes
 * @param {string} pagesDir Pages dir from Nuxt's configuration
 * @param {ResolvedOptions['defaultLocale']} defaultLocale Default locale from Nuxt's configuration
 * @return {ComputedPageOptions | false} Page options
 */
export function getPageOptions (route, pages, localeCodes, pagesDir, defaultLocale) {
  /** @type {ComputedPageOptions} */
  const options = {
    locales: localeCodes,
    paths: {}
  }
  const pattern = new RegExp(`${pagesDir}/`, 'i')
  const chunkName = route.chunkName ? route.chunkName.replace(pattern, '') : route.name
  const pageOptions = chunkName ? pages[chunkName] : undefined
  // Routing disabled
  if (pageOptions === false) {
    return false
  }
  // Skip if no page options defined
  if (!pageOptions) {
    return options
  }

  // Remove disabled locales from page options
  options.locales = options.locales.filter(locale => pageOptions[locale] !== false)

  // Construct paths object
  for (const locale of options.locales) {
    const customLocalePath = pageOptions[locale]
    if (typeof customLocalePath === 'string') {
      // Set custom path if any
      options.paths[locale] = customLocalePath
      continue
    }

    const customDefaultLocalePath = pageOptions[defaultLocale]
    if (typeof customDefaultLocalePath === 'string') {
      // Set default locale's custom path if any
      options.paths[locale] = customDefaultLocalePath
    }
  }

  return options
}
