const { resolve, join } = require('path')
const { readdirSync } = require('fs')
const i18nExtensions = require('vue-i18n-extensions')

const {
  MODULE_NAME,
  ROOT_DIR,
  PLUGINS_DIR,
  TEMPLATES_DIR,
  DEFAULT_OPTIONS,
  NESTED_OPTIONS,
  LOCALE_CODE_KEY,
  LOCALE_ISO_KEY,
  LOCALE_DOMAIN_KEY,
  LOCALE_FILE_KEY,
  STRATEGIES,
  COMPONENT_OPTIONS_KEY
} = require('./helpers/constants')

const {
  getLocaleCodes
} = require('./helpers/utils')

module.exports = function (userOptions) {
  const pluginsPath = join(__dirname, PLUGINS_DIR)
  const templatesPath = join(__dirname, TEMPLATES_DIR)
  const requiredPlugins = ['main', 'routing']
  const options = { ...DEFAULT_OPTIONS, ...userOptions, ...this.options.i18n }
  // Options that have nested config options must be merged
  // individually with defaults to prevent missing options
  for (const key of NESTED_OPTIONS) {
    if (options[key] !== false) {
      options[key] = { ...DEFAULT_OPTIONS[key], ...options[key] }
    }
  }

  if (!Object.values(STRATEGIES).includes(options.strategy)) {
    // eslint-disable-next-line no-console
    console.error('[' + options.MODULE_NAME + '] Invalid "strategy" option "' + options.strategy + '" (must be one of: ' + Object.values(STRATEGIES).join(', ') + ').')
    return
  }

  const localeCodes = getLocaleCodes(options.locales)

  const templatesOptions = {
    ...options,
    MODULE_NAME,
    LOCALE_CODE_KEY,
    LOCALE_ISO_KEY,
    LOCALE_DOMAIN_KEY,
    LOCALE_FILE_KEY,
    STRATEGIES,
    COMPONENT_OPTIONS_KEY,
    localeCodes
  }

  // Generate localized routes
  const pagesDir = this.options.dir && this.options.dir.pages ? this.options.dir.pages : 'pages'

  if (options.strategy !== STRATEGIES.NO_PREFIX) {
    if (localeCodes.length) {
      this.extendRoutes((routes) => {
        // This import (or more specifically 'vue-template-compiler' in helpers/components.js) needs to
        // be required only at build time to avoid problems when 'vue-template-compiler' dependency is
        // not available (at runtime, when using nuxt-start).
        const { makeRoutes } = require('./helpers/routes')

        const localizedRoutes = makeRoutes(routes, {
          ...options,
          pagesDir
        })
        routes.splice(0, routes.length)
        routes.unshift(...localizedRoutes)
      })
    }
  } else if (options.differentDomains) {
    // eslint-disable-next-line no-console
    console.warn('[' + options.MODULE_NAME + '] The `differentDomains` option and `no_prefix` strategy are not compatible. Change strategy or disable `differentDomains` option.')
  }

  if ('forwardedHost' in options) {
    // eslint-disable-next-line no-console
    console.warn('[' + options.MODULE_NAME + '] The `forwardedHost` option is deprecated. You can safely remove it. See: https://github.com/nuxt-community/nuxt-i18n/pull/630.')
  }

  // Plugins
  for (const file of requiredPlugins) {
    this.addPlugin({
      src: resolve(pluginsPath, `${file}.js`),
      fileName: join(ROOT_DIR, `plugin.${file}.js`),
      options: templatesOptions
    })
  }

  // Templates
  for (const file of readdirSync(templatesPath)) {
    this.addTemplate({
      src: resolve(templatesPath, file),
      fileName: join(ROOT_DIR, file),
      options: templatesOptions
    })
  }

  // SEO plugin
  if (options.seo) {
    this.addPlugin({
      src: resolve(pluginsPath, 'seo.js'),
      fileName: join(ROOT_DIR, 'plugin.seo.js'),
      options: templatesOptions
    })
  }

  // Add vue-i18n to vendors if using Nuxt 1.x
  if (this.options.build.vendor) {
    /* istanbul ignore next */
    this.options.build.vendor.push('vue-i18n')
  }

  // Add vue-i18n-loader if applicable
  if (options.vueI18nLoader) {
    this.extendBuild(config => {
      const loaders = config.module.rules.find(el => el.loader === 'vue-loader').options.loaders
      if (loaders) {
        // vue-loader under 15.0.0
        /* istanbul ignore next */
        loaders.i18n = '@intlify/vue-i18n-loader'
      } else {
        // vue-loader after 15.0.0
        config.module.rules.push({
          resourceQuery: /blockType=i18n/,
          type: 'javascript/auto',
          loader: '@intlify/vue-i18n-loader'
        })
      }
    })
  }

  this.options.router.middleware.push('nuxti18n')
  this.options.render.bundleRenderer.directives = this.options.render.bundleRenderer.directives || {}
  this.options.render.bundleRenderer.directives.t = i18nExtensions.directive
}
