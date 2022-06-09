import createDebug from 'debug'
import { isObject, isString } from '@intlify/shared'
import { defineNuxtModule, isNuxt2, isNuxt3, getNuxtVersion, resolveModule, addTemplate } from '@nuxt/kit'
import { resolve } from 'pathe'
import defu from 'defu'
import { setupNuxtBridge } from './bridge'
import { setupAutoImports } from './auto-imports'
import { extendBundler } from './bundler'
import { setupNuxt3 } from './nuxt3'
import { NUXT_I18N_MODULE_ID, DEFAULT_OPTIONS, STRATEGIES } from './constants'
import { formatMessage, getNormalizedLocales, resolveLocales } from './utils'
import { setupPages } from './pages'
import { generateLoaderOptions } from './gen'
import { distDir, pkgModulesDir } from './dirs'

import type { NuxtI18nOptions } from './types'

export * from './types'

const debug = createDebug('@nuxtjs/i18n:module')

export default defineNuxtModule<NuxtI18nOptions>({
  meta: {
    name: NUXT_I18N_MODULE_ID,
    configKey: 'i18n'
  },
  defaults: {},
  async setup(i18nOptions, nuxt) {
    const options = defu(i18nOptions, DEFAULT_OPTIONS) as Required<NuxtI18nOptions>
    debug('options', options)

    checkOptions(options)

    if (isNuxt2(nuxt)) {
      await setupNuxtBridge(nuxt)
    } else if (isNuxt3(nuxt)) {
      await setupNuxt3(nuxt)
    } else {
      throw new Error(formatMessage(`Cannot support nuxt version: ${getNuxtVersion(nuxt)}`))
    }

    // resolve langDir
    const langPath = isString(options.langDir) ? resolve(nuxt.options.srcDir, options.langDir) : null
    debug('langDir path', langPath)

    // resolve localeInfo
    const normalizedLocales = getNormalizedLocales(options.locales)
    const hasLocaleFiles = normalizedLocales.length > 0
    const localeCodes = normalizedLocales.map(locale => locale.code)
    const localeInfo = langPath != null ? await resolveLocales(langPath, normalizedLocales) : []
    debug('localeInfo', localeInfo)

    // resolve vueI18n options
    // prettier-ignore
    options.vueI18n = isObject(options.vueI18n)
      ? options.vueI18n
      : isString(options.vueI18n)
        ? resolve(nuxt.options.rootDir, options.vueI18n)
        : {}

    // setup nuxt/pages
    if (options.strategy !== STRATEGIES.NO_PREFIX && localeCodes.length) {
      await setupPages(options, nuxt, { isBridge: isNuxt2(nuxt), localeCodes })
    }

    // resolve @intlify/shared
    nuxt.options.alias['@intlify/shared'] = resolveModule('@intlify/shared/dist/shared.esm-bundler.js', {
      paths: nuxt.options.modulesDir
    })
    nuxt.options.build.transpile.push('@intlify/shared')

    // resolve @intlify/vue-router-bridge
    nuxt.options.alias['@intlify/vue-router-bridge'] = resolveModule('@intlify/vue-router-bridge/lib/index.mjs', {
      paths: [pkgModulesDir, ...nuxt.options.modulesDir]
    })
    nuxt.options.build.transpile.push('@intlify/vue-router-bridge')

    // resolve @intlify/vue-i18n-bridge
    nuxt.options.alias['@intlify/vue-i18n-bridge'] = resolveModule('@intlify/vue-i18n-bridge/lib/index.mjs', {
      paths: [pkgModulesDir, ...nuxt.options.modulesDir]
    })
    nuxt.options.build.transpile.push('@intlify/vue-i18n-bridge')

    // resolve vue-i18n-routing
    nuxt.options.alias['vue-i18n-routing'] = resolveModule('vue-i18n-routing/dist/vue-i18n-routing.es.js', {
      paths: [pkgModulesDir, ...nuxt.options.modulesDir]
    })
    nuxt.options.build.transpile.push('vue-i18n-routing')

    const i18nPath = addTemplate({
      filename: 'i18n.mjs',
      src: resolve(distDir, 'runtime/composables.mjs')
    })
    nuxt.options.alias['#i18n'] = i18nPath.dst!

    // TODO: We don't want to resolve the following as a template,
    //  but in the runtime dir we want to use as an ESM (e.g. internal and utils)

    addTemplate({
      filename: 'i18n.frags.mjs',
      src: resolve(distDir, 'runtime/frags.mjs')
    })

    // TODO: we should provide bridge only?
    addTemplate({
      filename: 'i18n.internal.mjs',
      src: resolve(distDir, 'runtime/internal.mjs')
    })

    addTemplate({
      filename: 'i18n.utils.mjs',
      src: resolve(distDir, 'runtime/utils.mjs')
    })

    // loading options template
    addTemplate({
      filename: 'i18n.options.mjs',
      write: true,
      getContents: () => {
        return generateLoaderOptions(options.lazy, langPath, {
          localeCodes,
          localeInfo,
          nuxtI18nOptions: options,
          nuxtI18nOptionsDefault: DEFAULT_OPTIONS,
          nuxtI18nInternalOptions: {
            __normalizedLocales: normalizedLocales
          }
        })
      }
    })

    // setup auto imports
    await setupAutoImports(nuxt)

    // extend bundler
    await extendBundler(hasLocaleFiles, langPath)
  }
})

function checkOptions(options: NuxtI18nOptions) {
  // check `lazy` and `langDir` option
  if (options.lazy && !options.langDir) {
    throw new Error(formatMessage('When using the "lazy" option you must also set the "langDir" option.'))
  }

  // check `langDir` option
  if (options.langDir) {
    const locales = options.locales || []
    if (!locales.length || isString(locales[0])) {
      throw new Error(formatMessage('When using the "langDir" option the "locales" must be a list of objects.'))
    }
    for (const locale of locales) {
      if (isString(locale) || !locale.file) {
        throw new Error(
          formatMessage(
            `All locales must be objects and have the "file" property set when using "langDir".\nFound none in:\n${JSON.stringify(
              locale,
              null,
              2
            )}.`
          )
        )
      }
    }
  }
}

// declare module 'nuxt3' {
//   export interface LegacyContext {
//     i18n: Composer | VueI18n
//   }
// }

declare module '@nuxt/schema' {
  interface NuxtConfig {
    i18n?: NuxtI18nOptions
  }
}
