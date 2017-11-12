const { resolve } = require('path')
const merge = require('lodash/merge')
const { generateRoutes } = require('./routes')

module.exports = function (moduleOptions) {
  const defaults = {}
  const options = merge(defaults, moduleOptions, this.options.i18n)

  const templatesOptions = {
    defaultLocale: options.defaultLocale,
    locales: JSON.stringify(options.locales),
    fallbackLocale: options.fallbackLocale,
    messages: JSON.stringify(options.messages)
  }

  this.extendRoutes((routes) => {
    const newRoutes = generateRoutes({
      baseRoutes: routes,
      locales: options.locales,
      defaultLocale: options.defaultLocale,
      routesOptions: options.routes
    })
    routes.splice(0, routes.length)
    routes.unshift(...newRoutes)
  })

  // i18n plugin
  this.addPlugin({
    src: resolve(__dirname, './templates/i18n.plugin.js'),
    fileName: 'i18n.plugin.js',
    options: templatesOptions
  })

  // Routing plugin
  this.addPlugin({
    src: resolve(__dirname, './templates/i18n.routing.plugin.js'),
    fileName: 'i18n.routing.plugin.js'
  })

  // Store module
  this.addTemplate({
    src: resolve(__dirname, './templates/i18n.store.js'),
    fileName: 'i18n.store.js',
    options: templatesOptions
  })

  // Middleware
  this.addTemplate({
    src: resolve(__dirname, './templates/i18n.routing.middleware.js'),
    fileName: 'i18n.routing.middleware.js',
    options: templatesOptions
  })
}
