import { STRATEGIES } from '../helpers/constants'
import { formatMessage } from '../templates/utils-common'
import { makeRoutes } from '../helpers/routes'

/**
 * @this {import('@nuxt/types/config/module').ModuleThis}
 *
 * @param {import('../../types/internal').ResolvedOptions} options
 * @return {import('@nuxt/types/config/router').NuxtOptionsRouter['extendRoutes']}
 */
export function createExtendRoutesHook (options) {
  const nuxtOptions = this.options

  let includeUprefixedFallback = nuxtOptions.target === 'static'
  // Doesn't seem like we can tell whether we are in nuxt generate from the module so we'll
  // take advantage of the 'generate:before' hook to store variable.
  this.nuxt.hook('generate:before', () => { includeUprefixedFallback = true })

  const pagesDir = nuxtOptions.dir && nuxtOptions.dir.pages ? nuxtOptions.dir.pages : 'pages'
  const { trailingSlash } = nuxtOptions.router

  return routes => {
    // Load 'vue-template-compiler' module with Resolver dynamically
    // See https://github.com/nuxt-community/i18n-module/issues/297#issuecomment-491755323
    const { parseComponent } = this.nuxt.resolver.requireModule('vue-template-compiler')

    const localizedRoutes = makeRoutes(routes, {
      ...options,
      pagesDir,
      includeUprefixedFallback,
      trailingSlash,
      parseComponent
    })
    routes.splice(0, routes.length)
    routes.unshift(...localizedRoutes)
  }
}

/**
 * @this {import('@nuxt/types/config/module').ModuleThis}
 *
 * @param {import('../../types/internal').ResolvedOptions} options
 */
export async function buildHook (options) {
  if (options.strategy === STRATEGIES.NO_PREFIX && options.differentDomains) {
    // eslint-disable-next-line no-console
    console.warn(formatMessage('The `differentDomains` option and `no_prefix` strategy are not compatible. Change strategy or disable `differentDomains` option.'))
  }

  if ('forwardedHost' in options) {
    // eslint-disable-next-line no-console
    console.warn(formatMessage('The `forwardedHost` option is deprecated. You can safely remove it. See: https://github.com/nuxt-community/i18n-module/pull/630.'))
  }

  options.additionalMessages = []
  await this.nuxt.callHook('i18n:extend-messages', options.additionalMessages)

  // Add vue-i18n-loader if applicable
  if (options.vueI18nLoader) {
    this.extendBuild(config => {
      if (!config.module) {
        console.warn(formatMessage('Failed to register the vue-i18n-loader.'))
        return
      }
      config.module.rules.push({
        resourceQuery: /blockType=i18n/,
        type: 'javascript/auto',
        loader: require.resolve('@intlify/vue-i18n-loader')
      })
    })
  }
}
