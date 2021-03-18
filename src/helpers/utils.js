/**
 * @typedef {import('../../types/internal').ResolvedOptions} ResolvedOptions
 */

/**
 * Get an array of locale codes from a list of locales
 *
 * @param  {ResolvedOptions['locales']}  locales
 * @return {import('../../types').Locale[]} List of locale codes
 */
export function getLocaleCodes (locales = []) {
  if (locales.length) {
    // If first item is a sting, assume locales is a list of codes already
    if (typeof locales[0] === 'string') {
      return /** @type {string[]} */(locales)
    }
    // Attempt to get codes from a list of objects
    if (typeof locales[0].code === 'string') {
      return /** @type {Required<import('../../types').LocaleObject[]>} */(locales).map(locale => locale.code)
    }
  }
  return []
}

/**
 * Retrieve page's options from the module's configuration for a given route
 *
 * @typedef {{ locales: string[], paths: Record<string, string> }} ComputedPageOptions
 *
 * @param  {import('@nuxt/types/config/router').NuxtRouteConfig} route
 * @param  {ResolvedOptions['pages']} pages Pages options from module's configuration
 * @param  {import('../../types').Locale[]} localeCodes
 * @param  {string} pagesDir Pages dir from Nuxt's configuration
 * @param  {ResolvedOptions['defaultLocale']} defaultLocale Default locale from Nuxt's configuration
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
