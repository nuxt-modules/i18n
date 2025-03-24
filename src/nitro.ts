/* eslint-disable @typescript-eslint/no-floating-promises */
import createDebug from 'debug'
import { resolveModuleExportNames } from 'mlly'
import { defu } from 'defu'
import { resolve } from 'pathe'
import { existsSync } from 'node:fs'
import { addServerImports, addServerPlugin, addServerTemplate, resolvePath, useLogger } from '@nuxt/kit'
import yamlPlugin from '@rollup/plugin-yaml'
import json5Plugin from '@miyaneee/rollup-plugin-json5'
import { getFeatureFlags } from './bundler'
import { getLayerI18n, toArray } from './utils'
import {
  H3_PKG,
  UTILS_H3_PKG,
  EXECUTABLE_EXTENSIONS,
  NUXT_I18N_MODULE_ID,
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
  NUXT_I18N_COMPOSABLE_DEFINE_CONFIG,
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE_DETECTOR
} from './constants'
import { resolveI18nDir } from './layers'

import type { Nuxt } from '@nuxt/schema'
import type { LocaleInfo } from './types'
import type { I18nNuxtContext } from './context'

const debug = createDebug('@nuxtjs/i18n:nitro')

export async function setupNitro(ctx: I18nNuxtContext, nuxt: Nuxt) {
  const [enableServerIntegration, localeDetectionPath] = await resolveLocaleDetectorPath(nuxt)

  const setupServer = enableServerIntegration || (ctx.options.experimental.typedOptionsAndMessages && ctx.isDev)
  if (setupServer) {
    addServerTemplate({
      filename: '#internal/i18n/options.mjs',
      getContents: () =>
        nuxt.vfs['#build/i18n.options.mjs']?.replace(/\/\*\* client \*\*\/[\s\S]*\/\*\* client-end \*\*\//, '')
    })

    addServerTemplate({
      filename: '#internal/i18n/locale.detector.mjs',
      getContents: () => `import localeDetector from ${JSON.stringify(localeDetectionPath)}
export { localeDetector }`
    })
  }

  nuxt.hook('nitro:config', async nitroConfig => {
    if (setupServer) {
      // inline module runtime in Nitro bundle
      nitroConfig.externals = defu(nitroConfig.externals ?? {}, { inline: [ctx.resolver.resolve('./runtime')] })

      nitroConfig.rollupConfig!.plugins = (await nitroConfig.rollupConfig!.plugins) || []
      nitroConfig.rollupConfig!.plugins = toArray(nitroConfig.rollupConfig!.plugins)

      const localePathsByType = getResourcePathsGrouped(ctx.localeInfo)
      // install server resource transform plugin for yaml / json5 format
      if (localePathsByType.yaml.length > 0) {
        nitroConfig.rollupConfig!.plugins.push(yamlPlugin({ include: localePathsByType.yaml }))
      }

      if (localePathsByType.json5.length > 0) {
        nitroConfig.rollupConfig!.plugins.push(json5Plugin({ include: localePathsByType.json5 }))
      }

      // auto import for server-side
      if (nitroConfig.imports) {
        // `@intlify/h3` utilities
        nitroConfig.imports.presets ||= []
        nitroConfig.imports.presets.push({ from: H3_PKG, imports: ['useTranslation'] })
      }
    }

    nitroConfig.replace ||= {}

    if (ctx.isSSR) {
      // vue-i18n feature flags configuration for server-side (server api, server middleware, etc...)
      nitroConfig.replace = {
        ...nitroConfig.replace,
        ...getFeatureFlags(ctx.options.bundle)
      }
    }

    // setup debug flag
    nitroConfig.replace['__DEBUG__'] = String(!!ctx.options.debug)
    nitroConfig.replace['__TEST__'] = String(!!ctx.options.debug || nuxt.options._i18nTest)
    debug('nitro.replace', nitroConfig.replace)
  })

  // `defineI18nLocale` and `defineI18nConfig`
  addServerImports(
    [NUXT_I18N_COMPOSABLE_DEFINE_LOCALE, NUXT_I18N_COMPOSABLE_DEFINE_CONFIG].map(key => ({
      name: key,
      as: key,
      from: ctx.resolver.resolve('runtime/composables/shared')
    }))
  )

  if (enableServerIntegration) {
    // `@intlify/utils/h3` and `defineLocaleDetector
    const h3UtilsExports = await resolveModuleExportNames(UTILS_H3_PKG, { url: import.meta.url })
    addServerImports([
      ...h3UtilsExports.map(key => ({
        name: key,
        as: key,
        from: ctx.resolver.resolve(nuxt.options.alias[UTILS_H3_PKG])
      })),
      {
        name: NUXT_I18N_COMPOSABLE_DEFINE_LOCALE_DETECTOR,
        as: NUXT_I18N_COMPOSABLE_DEFINE_LOCALE_DETECTOR,
        from: ctx.resolver.resolve('runtime/composables/server')
      }
    ])

    // add nitro plugin
    addServerPlugin(ctx.resolver.resolve('runtime/server/plugin'))
  }
}

async function resolveLocaleDetectorPath(nuxt: Nuxt) {
  const i18nLayer = nuxt.options._layers.find(l => !!getLayerI18n(l)?.experimental?.localeDetector)

  // no locale detector configured
  if (i18nLayer == null) {
    return [false, '']
  }

  const i18nLayerConfig = getLayerI18n(i18nLayer)
  const i18nDir = resolveI18nDir(i18nLayer, i18nLayerConfig!, true)
  const localeDetectorPath = await resolvePath(resolve(i18nDir, i18nLayerConfig!.experimental!.localeDetector!), {
    cwd: nuxt.options.rootDir,
    extensions: EXECUTABLE_EXTENSIONS
  })
  if (!existsSync(localeDetectorPath)) {
    const logger = useLogger(NUXT_I18N_MODULE_ID)
    logger.warn(`localeDetector file '${localeDetectorPath}' does not exist. skip server-side integration ...`)
    return [false, localeDetectorPath]
  }

  return [true, localeDetectorPath]
}

function getResourcePathsGrouped(localeInfo: LocaleInfo[]) {
  const groups: { yaml: string[]; json5: string[] } = { yaml: [], json5: [] }
  for (const locale of localeInfo) {
    groups.yaml = groups.yaml.concat(locale.meta.filter(meta => /\.ya?ml$/.test(meta.path)).map(x => x.path))
    groups.json5 = groups.json5.concat(locale.meta.filter(meta => /\.json5?$/.test(meta.path)).map(x => x.path))
  }
  return groups
}
