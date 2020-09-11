import { MODULE_NAME, STRATEGIES } from '../helpers/constants'

export function createExtendRoutesHook (moduleContainer, options) {
  const nuxtOptions = moduleContainer.options

  let includeUprefixedFallback = nuxtOptions.target === 'static'
  // Doesn't seem like we can tell whether we are in nuxt generate from the module so we'll
  // take advantage of the 'generate:before' hook to store variable.
  moduleContainer.nuxt.hook('generate:before', () => { includeUprefixedFallback = true })

  const pagesDir = nuxtOptions.dir && nuxtOptions.dir.pages ? nuxtOptions.dir.pages : 'pages'
  const { trailingSlash } = nuxtOptions.router

  return routes => {
    // This import (or more specifically 'vue-template-compiler' in helpers/components.js) needs to
    // be required only at build time to avoid problems when 'vue-template-compiler' dependency is
    // not available (at runtime, when using nuxt-start).
    const { makeRoutes } = require('../helpers/routes')

    const localizedRoutes = makeRoutes(routes, {
      ...options,
      pagesDir,
      includeUprefixedFallback,
      trailingSlash
    })
    routes.splice(0, routes.length)
    routes.unshift(...localizedRoutes)
  }
}

export function buildHook (moduleContainer, options) {
  const nuxtOptions = moduleContainer.options

  // Transpile deepcopy dependency that is not sufficiently transpiled for IE11.
  nuxtOptions.build.transpile.push(({ isServer, isModern }) => isServer || isModern ? false : 'deepcopy')

  if (options.langDir) {
    if (!options.locales.length || typeof options.locales[0] === 'string') {
      console.error('[' + MODULE_NAME + '] When using "langDir" option, the "locales" option must be a list of objects')
    }
  }

  if (options.strategy === STRATEGIES.NO_PREFIX && options.differentDomains) {
    // eslint-disable-next-line no-console
    console.warn('[' + MODULE_NAME + '] The `differentDomains` option and `no_prefix` strategy are not compatible. Change strategy or disable `differentDomains` option.')
  }

  if ('forwardedHost' in options) {
    // eslint-disable-next-line no-console
    console.warn('[' + MODULE_NAME + '] The `forwardedHost` option is deprecated. You can safely remove it. See: https://github.com/nuxt-community/i18n-module/pull/630.')
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
