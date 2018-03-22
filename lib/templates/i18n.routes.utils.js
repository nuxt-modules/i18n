/**
 * Check if a given route should be skipped when generating localized routes
 * @param  {String} route       Route to check
 * @param  {Array} ignoredPaths Ignored paths list from config
 * @return {Boolean}            True if path should be skipped, false otherwise
 */
const isIgnoredPath = (route, ignorePaths) => (
  ignorePaths.findIndex(pattern => {
    const regexp = new RegExp(pattern)
    return route.path.match(regexp)
  }) !== -1
)

module.exports = { isIgnoredPath }
