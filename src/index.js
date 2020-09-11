import { resolve, join } from 'path'
import { readdirSync } from 'fs'
import { directive as i18nExtensionsDirective } from '@intlify/vue-i18n-extensions'
import { MODULE_NAME, COMPONENT_OPTIONS_KEY, DEFAULT_OPTIONS, LOCALE_CODE_KEY, LOCALE_ISO_KEY, LOCALE_DOMAIN_KEY, LOCALE_FILE_KEY, NESTED_OPTIONS, ROOT_DIR, STRATEGIES } from './helpers/constants'
import { getLocaleCodes } from './helpers/utils'
import { buildHook, createExtendRoutesHook } from './core/hooks'

export default function (userOptions) {
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

  // Templates (including plugins).
  // This is done here rather than in the build hook to ensure the order the plugins are added
  // is predictable between different modules.
  const localeCodes = getLocaleCodes(options.locales)
  const nuxtOptions = this.options
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

  const templatesPath = join(__dirname, '/templates')
  for (const file of readdirSync(templatesPath)) {
    if (file.startsWith('plugin.')) {
      if (file === 'plugin.seo.js' && !options.seo) {
        continue
      }

      this.addPlugin({
        src: resolve(templatesPath, file),
        fileName: join(ROOT_DIR, file),
        options: templatesOptions
      })
    } else {
      this.addTemplate({
        src: resolve(templatesPath, file),
        fileName: join(ROOT_DIR, file),
        options: templatesOptions
      })
    }
  }

  if (options.strategy !== STRATEGIES.NO_PREFIX && localeCodes.length) {
    this.extendRoutes(createExtendRoutesHook(this, options))
  }

  this.nuxt.hook('build:before', () => buildHook(this, options))

  this.options.router.middleware.push('nuxti18n')
  this.options.render.bundleRenderer.directives = this.options.render.bundleRenderer.directives || {}
  this.options.render.bundleRenderer.directives.t = i18nExtensionsDirective
}
