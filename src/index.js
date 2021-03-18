import { resolve, join } from 'path'
import { readdirSync } from 'fs'
// @ts-ignore
import { directive as i18nExtensionsDirective } from '@intlify/vue-i18n-extensions'
import { MODULE_NAME, COMPONENT_OPTIONS_KEY, DEFAULT_OPTIONS, NESTED_OPTIONS, ROOT_DIR, STRATEGIES } from './helpers/constants'
import { getLocaleCodes } from './helpers/utils'
import { buildHook, createExtendRoutesHook } from './core/hooks'

/** @type {import('@nuxt/types').Module<import('../types').Options>} */
export default function (userOptions) {
  /** @type {import('../types/internal').ResolvedOptions} */
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

  if (options.lazy) {
    if (!options.langDir) {
      throw new Error(`[${MODULE_NAME}] When using the "lazy" option you must also set the "langDir" option.`)
    }
    if (!options.locales.length || typeof options.locales[0] === 'string') {
      throw new Error(`[${MODULE_NAME}] When using the "langDir" option the "locales" option must be a list of objects.`)
    }
    for (const locale of options.locales) {
      if (typeof (locale) === 'string' || !locale.file) {
        throw new Error(`[${MODULE_NAME}] All locales must be objects and have the "file" property set when using "lazy".\nFound none in:\n${JSON.stringify(locale, null, 2)}.`)
      }
    }
    options.langDir = this.nuxt.resolver.resolveAlias(options.langDir)
  }

  // Templates (including plugins).
  // This is done here rather than in the build hook to ensure the order the plugins are added
  // is predictable between different modules.
  const localeCodes = getLocaleCodes(options.locales)
  const nuxtOptions = this.options

  const templatesOptions = {
    Constants: {
      COMPONENT_OPTIONS_KEY,
      MODULE_NAME,
      STRATEGIES
    },
    localeCodes,
    nuxtOptions: {
      isUniversalMode: nuxtOptions.mode === 'universal',
      trailingSlash: nuxtOptions.router.trailingSlash
    },
    options
  }

  const templatesPath = join(__dirname, '/templates')
  for (const file of readdirSync(templatesPath)) {
    if (!file.endsWith('.js')) {
      continue
    }
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
    this.extendRoutes(createExtendRoutesHook.call(this, options))
  }

  this.nuxt.hook('build:before', () => buildHook.call(this, options))

  this.options.alias['~i18n-klona'] = require.resolve('klona/full').replace(/\.js$/, '.mjs')

  if (!Array.isArray(this.options.router.middleware)) {
    throw new TypeError(`[${MODULE_NAME}] options.router.middleware is not an array.`)
  }
  this.options.router.middleware.push('nuxti18n')

  if (!this.options.render.bundleRenderer || typeof (this.options.render.bundleRenderer) !== 'object') {
    throw new TypeError(`[${MODULE_NAME}] options.render.bundleRenderer is not an object.`)
  }
  this.options.render.bundleRenderer.directives = this.options.render.bundleRenderer.directives || {}
  this.options.render.bundleRenderer.directives.t = i18nExtensionsDirective
}
