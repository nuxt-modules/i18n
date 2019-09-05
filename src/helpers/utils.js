const { LOCALE_CODE_KEY } = require('./constants')

/**
 * Get an array of locale codes from a list of locales
 * @param  {Array}  locales Locales list from nuxt config
 * @return {Array}          List of locale codes
 */
const getLocaleCodes = (locales = []) => {
  if (locales.length) {
    // If first item is a sting, assume locales is a list of codes already
    if (typeof locales[0] === 'string') {
      return locales
    }
    // Attempt to get codes from a list of objects
    if (typeof locales[0][LOCALE_CODE_KEY] === 'string') {
      return locales.map(locale => locale[LOCALE_CODE_KEY])
    }
  }
  return []
}

exports.getLocaleCodes = getLocaleCodes

/**
 * Retrieve page's options from the module's configuration for a given route
 * @param  {Object} route         Route
 * @param  {Object} pages         Pages options from module's configuration
 * @param  {Array} locales        Locale from module's configuration
 * @param  {String} pagesDir      Pages dir from Nuxt's configuration
 * @param  {String} defaultLocale Default locale from Nuxt's configuration
 * @return {Object}               Page options
 */
exports.getPageOptions = (route, pages, locales, pagesDir, defaultLocale) => {
  const options = {
    locales: getLocaleCodes(locales),
    paths: {}
  }
  const pattern = new RegExp(`${pagesDir}/`, 'i')
  const chunkName = route.chunkName ? route.chunkName.replace(pattern, '') : route.name
  const pageOptions = pages[chunkName]
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
  options.locales
    .forEach(locale => {
      if (typeof pageOptions[locale] === 'string') {
        // Set custom path if any
        options.paths[locale] = pageOptions[locale]
      } else if (typeof pageOptions[defaultLocale] === 'string') {
        // Set default locale's custom path if any
        options.paths[locale] = pageOptions[defaultLocale]
      }
    })

  return options
}
