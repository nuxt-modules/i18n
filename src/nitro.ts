/* eslint-disable @typescript-eslint/no-floating-promises */
import createDebug from 'debug'
import { resolveModuleExportNames } from 'mlly'
import { defu } from 'defu'
import { resolve } from 'pathe'
import { addServerImports, addServerPlugin, resolvePath, useLogger } from '@nuxt/kit'
import yamlPlugin from '@rollup/plugin-yaml'
import json5Plugin from '@miyaneee/rollup-plugin-json5'
import { getFeatureFlags } from './bundler'
import { getLayerI18n, isExists, toArray } from './utils'
import {
  H3_PKG,
  UTILS_H3_PKG,
  EXECUTABLE_EXTENSIONS,
  NUXT_I18N_MODULE_ID,
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
  NUXT_I18N_COMPOSABLE_DEFINE_CONFIG,
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE_DETECTOR
} from './constants'

import type { Nuxt } from '@nuxt/schema'
import type { LocaleInfo } from './types'
import { resolveI18nDir } from './layers'
import { i18nVirtualLoggerPlugin } from './virtual-logger'
import type { I18nNuxtContext } from './context'

const debug = createDebug('@nuxtjs/i18n:nitro')

type AdditionalSetupNitroParams = {
  optionsCode: string
  localeInfo: LocaleInfo[]
}

export async function setupNitro(
  { genTemplate, isSSR, localeInfo, resolver, options: nuxtOptions, isDev }: I18nNuxtContext,
  nuxt: Nuxt
) {
  const [enableServerIntegration, localeDetectionPath] = await resolveLocaleDetectorPath(nuxt)

  nuxt.hook('nitro:config', async nitroConfig => {
    if (enableServerIntegration || (nuxtOptions.experimental.typedOptionsAndMessages && isDev)) {
      const additionalParams: AdditionalSetupNitroParams = { optionsCode: genTemplate(true, true), localeInfo }

      // inline module runtime in Nitro bundle
      nitroConfig.externals = defu(nitroConfig.externals ?? {}, { inline: [resolver.resolve('./runtime')] })

      // install server resource transform plugin for yaml / json5 format
      nitroConfig.rollupConfig!.plugins = (await nitroConfig.rollupConfig!.plugins) || []
      nitroConfig.rollupConfig!.plugins = toArray(nitroConfig.rollupConfig!.plugins)

      nitroConfig.rollupConfig!.plugins.push(i18nVirtualLoggerPlugin(nuxtOptions.debug).rollup())

      const yamlPaths = getResourcePaths(additionalParams.localeInfo, /\.ya?ml$/)
      if (yamlPaths.length > 0) {
        nitroConfig.rollupConfig!.plugins.push(yamlPlugin({ include: yamlPaths }))
      }

      const json5Paths = getResourcePaths(additionalParams.localeInfo, /\.json5?$/)
      if (json5Paths.length > 0) {
        nitroConfig.rollupConfig!.plugins.push(json5Plugin({ include: json5Paths }))
      }

      nitroConfig.virtual ||= {}
      nitroConfig.virtual['#internal/i18n/options.mjs'] = () => additionalParams.optionsCode
      nitroConfig.virtual['#internal/i18n/locale.detector.mjs'] = () => `
import localeDetector from ${JSON.stringify(localeDetectionPath)}
export { localeDetector }
`

      // auto import for server-side
      if (nitroConfig.imports) {
        // `@intlify/h3` utilities
        nitroConfig.imports.presets ||= []
        nitroConfig.imports.presets.push({ from: H3_PKG, imports: ['useTranslation'] })
      }
    }

    nitroConfig.replace ||= {}

    if (isSSR) {
      // vue-i18n feature flags configuration for server-side (server api, server middleware, etc...)
      nitroConfig.replace = {
        ...nitroConfig.replace,
        ...getFeatureFlags(nuxtOptions.bundle)
      }
    }

    // setup debug flag
    nitroConfig.replace['__DEBUG__'] = String(!!nuxtOptions.debug)
    debug('nitro.replace', nitroConfig.replace)
  })

  // `defineI18nLocale` and `defineI18nConfig`
  addServerImports([
    ...[NUXT_I18N_COMPOSABLE_DEFINE_LOCALE, NUXT_I18N_COMPOSABLE_DEFINE_CONFIG].map(key => ({
      name: key,
      as: key,
      from: resolver.resolve('runtime/composables/shared')
    }))
  ])

  if (enableServerIntegration) {
    // `@intlify/utils/h3` and `defineLocaleDetector
    const h3UtilsExports = await resolveModuleExportNames(UTILS_H3_PKG, { url: import.meta.url })
    addServerImports([
      ...h3UtilsExports.map(key => ({
        name: key,
        as: key,
        from: resolver.resolve(nuxt.options.alias[UTILS_H3_PKG])
      })),
      {
        name: NUXT_I18N_COMPOSABLE_DEFINE_LOCALE_DETECTOR,
        as: NUXT_I18N_COMPOSABLE_DEFINE_LOCALE_DETECTOR,
        from: resolver.resolve('runtime/composables/server')
      }
    ])

    // add nitro plugin
    addServerPlugin(resolver.resolve('runtime/server/plugin'))
  }
}

async function resolveLocaleDetectorPath(nuxt: Nuxt) {
  const serverI18nLayer = nuxt.options._layers.find(l => {
    const layerI18n = getLayerI18n(l)
    return layerI18n?.experimental?.localeDetector != null && layerI18n?.experimental?.localeDetector !== ''
  })

  let enableServerIntegration = serverI18nLayer != null

  if (serverI18nLayer == null) {
    return [enableServerIntegration, '']
  }

  const serverI18nLayerConfig = getLayerI18n(serverI18nLayer)
  const i18nDir = resolveI18nDir(serverI18nLayer, serverI18nLayerConfig!, true)
  const pathTo = resolve(i18nDir, serverI18nLayerConfig!.experimental!.localeDetector!)
  const localeDetectorPath = await resolvePath(pathTo, { cwd: nuxt.options.rootDir, extensions: EXECUTABLE_EXTENSIONS })
  const hasLocaleDetector = await isExists(localeDetectorPath)
  if (!hasLocaleDetector) {
    const logger = useLogger(NUXT_I18N_MODULE_ID)
    logger.warn(`localeDetector file '${localeDetectorPath}' does not exist. skip server-side integration ...`)
    enableServerIntegration = false
  }

  return [enableServerIntegration, localeDetectorPath]
}

function getResourcePaths(localeInfo: LocaleInfo[], extPattern: RegExp): string[] {
  return localeInfo.reduce((acc, locale) => {
    if (!locale.meta) return acc
    const collected = locale.meta
      .map(meta => (extPattern.test(meta.path) ? meta.path : undefined))
      .filter(Boolean) as string[]
    return [...acc, ...collected]
  }, [] as string[])
}
