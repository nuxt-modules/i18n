import { resolve, join } from 'path'
import { readdirSync } from 'fs'
import i18nExtensions from 'vue-i18n-extensions'

import {
  MODULE_NAME,
  ROOT_DIR,
  PLUGINS_DIR,
  TEMPLATES_DIR,
  DEFAULT_OPTIONS,
  LOCALE_CODE_KEY,
  LOCALE_ISO_KEY,
  LOCALE_DOMAIN_KEY,
  LOCALE_FILE_KEY
} from './helpers/constants'
import { makeRoutes } from './helpers/routes'
import {
  getLocaleCodes,
  getLocaleFromRoute,
  getHostname,
  getLocaleDomain
} from './helpers/utils'

export default function (userOptions) {
  const pluginsPath = join(__dirname, PLUGINS_DIR)
  const templatesPath = join(__dirname, TEMPLATES_DIR)
  const requiredPlugins = ['main', 'routing']
  const options = { ...DEFAULT_OPTIONS, ...userOptions }
  const templatesOptions = {
    ...options,
    MODULE_NAME,
    LOCALE_CODE_KEY,
    LOCALE_ISO_KEY,
    LOCALE_DOMAIN_KEY,
    LOCALE_FILE_KEY,
    getLocaleCodes,
    getLocaleFromRoute,
    getHostname,
    getLocaleDomain
  }

  // Generate localized routes
  this.extendRoutes((routes) => {
    const localizedRoutes = makeRoutes(routes, options)
    routes.splice(0, routes.length)
    routes.unshift(...localizedRoutes)
  })

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
      src: resolve(pluginsPath, `seo.js`),
      fileName: join(ROOT_DIR, `plugin.seo.js`),
      options: templatesOptions
    })
  }

  // Add vue-i18n to vendors if using Nuxt 1.x
  if (this.options.build.vendor) {
    this.options.build.vendor.push('vue-i18n')
  }

  this.options.router.middleware.push('i18n')
  this.options.render.bundleRenderer.directives = this.options.render.bundleRenderer.directives || {}
  this.options.render.bundleRenderer.directives.t = i18nExtensions.directive
}
