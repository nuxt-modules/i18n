const { resolve } = require('path')
const merge = require('lodash/merge')
const i18nExtensions = require('vue-i18n-extensions')
const { generateRoutes } = require('./routes')

module.exports = function (moduleOptions) {
  const defaults = {
    noPrefixDefaultLocale: true
  }
  const options = merge(defaults, moduleOptions, this.options.i18n)

  this.extendRoutes((routes) => {
    const newRoutes = generateRoutes({
      baseRoutes: routes,
      locales: options.locales,
      defaultLocale: options.defaultLocale,
      routesOptions: options.routes,
      noPrefixDefaultLocale: options.noPrefixDefaultLocale,
      redirectRootToLocale: options.redirectRootToLocale,
      ignorePaths: options.ignorePaths
    })
    routes.splice(0, routes.length)
    routes.unshift(...newRoutes)
  })

  // i18n plugin
  this.addPlugin({
    src: resolve(__dirname, './templates/i18n.plugin.js'),
    fileName: 'i18n.plugin.js',
    options
  })

  // Routing plugin
  this.addPlugin({
    src: resolve(__dirname, './templates/i18n.routing.plugin.js'),
    fileName: 'i18n.routing.plugin.js',
    options
  })

  // Middleware
  this.addTemplate({
    src: resolve(__dirname, './templates/i18n.routing.middleware.js'),
    fileName: 'i18n.routing.middleware.js',
    options
  })
  this.options.router.middleware.push('i18n')

  this.options.build.vendor.push('vue-i18n')

  this.options.render.bundleRenderer.directives = this.options.render.bundleRenderer.directives || {}
  this.options.render.bundleRenderer.directives.t = i18nExtensions.directive
}
