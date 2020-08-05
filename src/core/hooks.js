import { resolve, join } from 'path'
import { readdirSync } from 'fs'
import { getLocaleCodes } from '../helpers/utils'
import { MODULE_NAME, ROOT_DIR, LOCALE_CODE_KEY, LOCALE_ISO_KEY, LOCALE_DOMAIN_KEY, LOCALE_FILE_KEY, STRATEGIES, COMPONENT_OPTIONS_KEY } from '../helpers/constants'

export async function buildHook (moduleContainer, options) {
  const nuxtOptions = moduleContainer.options

  // Copy lang files to the build directory.
  if (options.langDir) {
    if (!options.locales.length || typeof options.locales[0] === 'string') {
      console.error('[' + MODULE_NAME + '] When using "langDir" option, the "locales" option must be a list of objects')
    }
  }

  const localeCodes = getLocaleCodes(options.locales)
  const { trailingSlash } = nuxtOptions.router

  const templatesOptions = {
    ...options,
    IS_UNIVERSAL_MODE: nuxtOptions.mode === 'universal',
    MODULE_NAME,
    LOCALE_CODE_KEY,
    LOCALE_ISO_KEY,
    LOCALE_DOMAIN_KEY,
    LOCALE_FILE_KEY,
    STRATEGIES,
    COMPONENT_OPTIONS_KEY,
    localeCodes,
    trailingSlash
  }

  const isNoPrefixStrategy = options.strategy === STRATEGIES.NO_PREFIX

  if (isNoPrefixStrategy && options.differentDomains) {
    // eslint-disable-next-line no-console
    console.warn('[' + MODULE_NAME + '] The `differentDomains` option and `no_prefix` strategy are not compatible. Change strategy or disable `differentDomains` option.')
  } else if (localeCodes.length) {
    const pagesDir = nuxtOptions.dir && nuxtOptions.dir.pages ? nuxtOptions.dir.pages : 'pages'

    let includeUprefixedFallback = false
    if (!isNoPrefixStrategy) {
      includeUprefixedFallback = nuxtOptions.target === 'static'
      // Doesn't seem like we can tell whether we are in nuxt generate from the module so we'll
      // take advantage of the 'generate:before' hook to store variable.
      moduleContainer.nuxt.hook('generate:before', () => { includeUprefixedFallback = true })
    }

    // This import (or more specifically 'vue-template-compiler' in helpers/components.js) needs to
    // be required only at build time to avoid problems when 'vue-template-compiler' dependency is
    // not available (at runtime, when using nuxt-start).
    const { makeRoutes } = await import('../helpers/routes')
    moduleContainer.extendRoutes(routes => {
      const localizedRoutes = makeRoutes(routes, {
        ...options,
        pagesDir,
        includeUprefixedFallback,
        trailingSlash
      })
      routes.splice(0, routes.length)
      routes.unshift(...localizedRoutes)
    })
  }

  if ('forwardedHost' in options) {
    // eslint-disable-next-line no-console
    console.warn('[' + MODULE_NAME + '] The `forwardedHost` option is deprecated. You can safely remove it. See: https://github.com/nuxt-community/i18n-module/pull/630.')
  }

  const templatesPath = join(__dirname, '..', '/templates')

  // Templates (including plugins)
  for (const file of readdirSync(templatesPath)) {
    if (file.startsWith('plugin.')) {
      if (file === 'plugin.seo.js' && !options.seo) {
        continue
      }

      moduleContainer.addPlugin({
        src: resolve(templatesPath, file),
        fileName: join(ROOT_DIR, file),
        options: templatesOptions
      })
    } else {
      moduleContainer.addTemplate({
        src: resolve(templatesPath, file),
        fileName: join(ROOT_DIR, file),
        options: templatesOptions
      })
    }
  }

  // Add vue-i18n-loader if applicable
  if (options.vueI18nLoader) {
    moduleContainer.extendBuild(config => {
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
}
