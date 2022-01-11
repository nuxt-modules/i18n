import { resolve, join } from 'path'
import { readdirSync } from 'fs'
import merge from 'lodash.merge'
// @ts-ignore
import { directive as i18nExtensionsDirective } from '@intlify/vue-i18n-extensions'
import { COMPONENT_OPTIONS_KEY, DEFAULT_OPTIONS, ROOT_DIR, STRATEGIES, REDIRECT_ON_OPTIONS } from './helpers/constants'
import { buildHook, createExtendRoutesHook } from './core/hooks'
import { formatMessage } from './templates/utils-common'

/** @type {import('@nuxt/types').Module<import('../types').Options>} */
export default async function (moduleOptions) {
  /** @type {import('../types/internal').ResolvedOptions} */
  const options = merge({}, DEFAULT_OPTIONS, moduleOptions, this.options.i18n)

  if (!Object.values(STRATEGIES).includes(options.strategy)) {
    // eslint-disable-next-line no-console
    console.error(formatMessage(`Invalid "strategy" option "${options.strategy}" (must be one of: ${Object.values(STRATEGIES).join(', ')}).`))
    return
  }

  if (options.lazy && !options.langDir) {
    throw new Error(formatMessage('When using the "lazy" option you must also set the "langDir" option.'))
  }

  if (options.langDir) {
    if (!options.locales.length || typeof options.locales[0] === 'string') {
      throw new Error(formatMessage('When using the "langDir" option the "locales" must be a list of objects.'))
    }
    for (const locale of options.locales) {
      if (typeof (locale) === 'string' || !locale.file) {
        throw new Error(formatMessage(`All locales must be objects and have the "file" property set when using "langDir".\nFound none in:\n${JSON.stringify(locale, null, 2)}.`))
      }
    }
    options.langDir = this.nuxt.resolver.resolveAlias(options.langDir)
  }

  // Templates (including plugins).
  // This is done here rather than in the build hook to ensure the order the plugins are added
  // is predictable between different modules.
  const nuxtOptions = this.options
  const normalizedLocales = []
  for (const locale of options.locales) {
    if (typeof (locale) === 'string') {
      normalizedLocales.push({ code: locale })
    } else {
      normalizedLocales.push(locale)
    }
  }
  options.normalizedLocales = normalizedLocales
  // Get an array of locale codes from the list of locales.
  options.localeCodes = options.normalizedLocales.map(locale => locale.code)

  const templatesOptions = {
    Constants: {
      COMPONENT_OPTIONS_KEY,
      STRATEGIES,
      REDIRECT_ON_OPTIONS
    },
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

  if (options.strategy !== STRATEGIES.NO_PREFIX && options.localeCodes.length) {
    this.extendRoutes(createExtendRoutesHook.call(this, options))
  }

  await this.nuxt.hook('build:before', () => buildHook.call(this, options))

  this.options.alias['~i18n-klona'] = require.resolve('klona/full').replace(/\.js$/, '.mjs')
  this.options.alias['~i18n-ufo'] = require.resolve('ufo').replace(/\.js$/, '.mjs')

  if (!Array.isArray(this.options.router.middleware)) {
    throw new TypeError(formatMessage('options.router.middleware is not an array.'))
  }
  this.options.router.middleware.push('nuxti18n')

  if (!this.options.render.bundleRenderer || typeof (this.options.render.bundleRenderer) !== 'object') {
    throw new TypeError(formatMessage('options.render.bundleRenderer is not an object.'))
  }
  this.options.render.bundleRenderer.directives = this.options.render.bundleRenderer.directives || {}
  this.options.render.bundleRenderer.directives.t = i18nExtensionsDirective

  // Transpile is-https (IE11)
  this.options.build.transpile = this.options.build.transpile || []
  this.options.build.transpile.push('is-https')
}
