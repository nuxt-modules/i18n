import { resolveModuleExportNames } from 'mlly'
import { defu } from 'defu'
import { resolve } from 'pathe'
import { existsSync } from 'node:fs'
import { addServerHandler, addServerImports, addServerPlugin, addServerTemplate, resolvePath } from '@nuxt/kit'
import yamlPlugin from '@rollup/plugin-yaml'
import json5Plugin from '@miyaneee/rollup-plugin-json5'
import { getDefineConfig } from './bundler'
import { getLayerI18n, logger, toArray } from './utils'
import {
  H3_PKG,
  UTILS_H3_PKG,
  EXECUTABLE_EXTENSIONS,
  DEFINE_I18N_LOCALE_FN,
  DEFINE_I18N_CONFIG_FN,
  DEFINE_LOCALE_DETECTOR_FN
} from './constants'
import { resolveI18nDir } from './layers'

import type { Nuxt } from '@nuxt/schema'
import type { LocaleInfo } from './types'
import type { I18nNuxtContext } from './context'

export async function setupNitro(ctx: I18nNuxtContext, nuxt: Nuxt) {
  const [enableServerIntegration, localeDetectionPath] = await resolveLocaleDetectorPath(nuxt)

  addServerTemplate({
    filename: '#internal/i18n-options.mjs',
    getContents: () =>
      nuxt.vfs['#build/i18n-options.mjs']!.replace(/\/\*\* client \*\*\/[\s\S]*\/\*\* client-end \*\*\//, '')
  })

  addServerTemplate({
    filename: '#internal/i18n-route-resources.mjs',
    getContents: () => nuxt.vfs['#build/i18n-route-resources.mjs'] || ''
  })

  addServerTemplate({
    filename: '#internal/i18n-locale-detector.mjs',
    getContents: () =>
      enableServerIntegration
        ? `import localeDetector from ${JSON.stringify(localeDetectionPath)}
export { localeDetector }`
        : `const localeDetector = undefined
        export { localeDetector }` // no-op
  })

  nuxt.hook('nitro:config', async nitroConfig => {
    // inline module runtime in Nitro bundle
    nitroConfig.externals = defu(nitroConfig.externals ?? {}, { inline: [ctx.resolver.resolve('./runtime')] })
    nitroConfig.alias!['#i18n'] = ctx.resolver.resolve('./runtime/composables/index-server')

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

    nitroConfig.replace = Object.assign({}, nitroConfig.replace, getDefineConfig(ctx, true))
  })

  // `defineI18nLocale`, `defineI18nConfig`
  addServerImports(
    [DEFINE_I18N_LOCALE_FN, DEFINE_I18N_CONFIG_FN].map(key => ({
      name: key,
      as: key,
      from: ctx.resolver.resolve('runtime/composables/shared')
    }))
  )

  // `defineLocaleDetector`
  addServerImports([
    {
      name: DEFINE_LOCALE_DETECTOR_FN,
      as: DEFINE_LOCALE_DETECTOR_FN,
      from: ctx.resolver.resolve('runtime/composables/server')
    }
  ])

  // `@intlify/utils/h3`
  const h3UtilsExports = await resolveModuleExportNames(UTILS_H3_PKG, { url: import.meta.url })
  addServerImports(
    h3UtilsExports.map(key => ({
      name: key,
      as: key,
      from: ctx.resolver.resolve(nuxt.options.alias[UTILS_H3_PKG]!)
    }))
  )

  // add nitro plugin
  addServerPlugin(ctx.resolver.resolve('runtime/server/plugin'))

  addServerHandler({
    route: `/_i18n/:hash/:locale/messages.json`,
    handler: ctx.resolver.resolve('./runtime/server/routes/messages')
  })
}

async function resolveLocaleDetectorPath(nuxt: Nuxt) {
  const i18nLayer = nuxt.options._layers.find(l => !!getLayerI18n(l)?.experimental?.localeDetector)

  // no locale detector configured
  if (i18nLayer == null) {
    return [false, '']
  }

  const i18nLayerConfig = getLayerI18n(i18nLayer)
  const i18nDir = resolveI18nDir(i18nLayer, i18nLayerConfig!)
  const localeDetectorPath = await resolvePath(resolve(i18nDir, i18nLayerConfig!.experimental!.localeDetector!), {
    cwd: nuxt.options.rootDir,
    extensions: EXECUTABLE_EXTENSIONS
  })

  const exists = existsSync(localeDetectorPath)
  if (!exists) {
    logger.warn(`localeDetector file '${localeDetectorPath}' does not exist. skip server-side integration ...`)
  }

  return [exists, localeDetectorPath]
}

function getResourcePathsGrouped(localeInfo: LocaleInfo[]) {
  const groups: { yaml: string[]; json5: string[] } = { yaml: [], json5: [] }
  for (const locale of localeInfo) {
    groups.yaml = groups.yaml.concat(locale.meta.filter(meta => /\.ya?ml$/.test(meta.path)).map(x => x.path))
    groups.json5 = groups.json5.concat(locale.meta.filter(meta => /\.json5?$/.test(meta.path)).map(x => x.path))
  }
  return groups
}
