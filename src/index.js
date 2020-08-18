import { directive as i18nExtensionsDirective } from '@intlify/vue-i18n-extensions'
import { MODULE_NAME, DEFAULT_OPTIONS, NESTED_OPTIONS, STRATEGIES } from './helpers/constants'
import { getLocaleCodes } from './helpers/utils'
import { buildHook, createExtendRoutesHook } from './core/hooks'

export default async function (userOptions) {
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
    console.error('[' + MODULE_NAME + '] Invalid "strategy" option "' + options.strategy + '" (must be one of: ' + Object.values(STRATEGIES).join(', ') + ').')
    return
  }

  const localeCodes = getLocaleCodes(options.locales)
  if (options.strategy !== STRATEGIES.NO_PREFIX && localeCodes.length) {
    this.extendRoutes(await createExtendRoutesHook(this, options))
  }

  this.nuxt.hook('build:before', () => buildHook(this, options))

  this.options.router.middleware.push('nuxti18n')
  this.options.render.bundleRenderer.directives = this.options.render.bundleRenderer.directives || {}
  this.options.render.bundleRenderer.directives.t = i18nExtensionsDirective
}
