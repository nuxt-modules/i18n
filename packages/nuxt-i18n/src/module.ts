import createDebug from 'debug'
import { isObject, isString } from '@intlify/shared'
import { defineNuxtModule, isNuxt2, isNuxt3, getNuxtVersion, resolveModule, addTemplate } from '@nuxt/kit'
import { resolve } from 'pathe'
import defu from 'defu'
import { setupNuxtBridge } from './bridge'
import { setupAutoImports } from './auto-imports'
import { extendBundler } from './bundler'
import { setupNuxt3 } from './nuxt3'
import { DEFAULT_OPTIONS, STRATEGIES } from './constants'
import { getNormalizedLocales, resolveLocales } from './utils'
import { setupPages } from './pages'
import { generateLoaderOptions } from './gen'
import { distDir } from './dirs'

import type { Composer } from 'vue-i18n'
import type { NuxtI18nOptions, NuxtI18nInternalOptions } from './types'

export * from './types'

const debug = createDebug('@nuxtjs/i18n:module')

export default defineNuxtModule<NuxtI18nOptions>({
  meta: {
    name: '@nuxtjs/i18n',
    configKey: 'i18n'
  },
  defaults: {},
  async setup(i18nOptions, nuxt) {
    const options = defu(i18nOptions, DEFAULT_OPTIONS) as Required<NuxtI18nOptions>
    options.langDir = options.langDir || 'locales'
    debug('options', options)

    if (isNuxt2(nuxt)) {
      await setupNuxtBridge(nuxt)
    } else if (isNuxt3(nuxt)) {
      await setupNuxt3(nuxt)
    } else {
      throw new Error(`Cannot support nuxt version: ${getNuxtVersion(nuxt)}`)
    }

    // resolve langDir
    const langPath = resolve(nuxt.options.srcDir, options.langDir)
    debug('langDir path', langPath)

    // resolve localeInfo
    const normalizedLocales = ((options as NuxtI18nInternalOptions).__normalizedLocales = getNormalizedLocales(
      options.locales
    ))
    const hasLocaleFiles = normalizedLocales.length > 0
    const localeCodes = normalizedLocales.map(locale => locale.code)
    const localeInfo = await resolveLocales(langPath, normalizedLocales)
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

    // resolve vue-i18n-routing
    nuxt.options.alias['vue-i18n-routing'] = resolveModule('vue-i18n-routing/dist/vue-i18n-routing.es.js', {
      paths: nuxt.options.modulesDir
    })
    nuxt.options.build.transpile.push('vue-i18n-routing')

    const i18nPath = addTemplate({
      filename: 'i18n.mjs',
      src: resolve(distDir, 'runtime/composables.mjs')
    })
    nuxt.options.alias['#i18n'] = i18nPath.dst!

    // TODO: we should provide bridge only?
    addTemplate({
      filename: 'i18n.legacy.mjs',
      src: resolve(distDir, 'runtime/legacy.mjs')
    })

    addTemplate({
      filename: 'i18n.utils.mjs',
      src: resolve(distDir, 'runtime/utils.mjs')
    })

    // loading options template
    addTemplate({
      filename: 'i18n.options.mjs',
      getContents: () => {
        return generateLoaderOptions({ localeCodes, localeInfo, nuxtI18nOptions: options })
      }
    })

    // setup auto imports
    await setupAutoImports(nuxt)

    // extend bundler
    await extendBundler(hasLocaleFiles, langPath)
  }
})

declare module '@nuxt/kit' {
  export interface NuxtApp {
    $i18n: Composer
  }
}

declare module '@nuxt/schema' {
  interface NuxtConfig {
    i18n?: NuxtI18nOptions
  }
}
