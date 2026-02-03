import { resolveModuleExportNames } from 'mlly'
import { defu } from 'defu'
import { existsSync } from 'node:fs'
import { addServerHandler, addServerImports, addServerPlugin, addServerTemplate, resolveModule, resolvePath } from '@nuxt/kit'
import yamlPlugin from '@rollup/plugin-yaml'
import json5Plugin from '@miyaneee/rollup-plugin-json5'
import { getDefineConfig } from './bundler'
import { logger, toArray } from './utils'
import { EXECUTABLE_EXTENSIONS } from './constants'

import type { Nuxt } from '@nuxt/schema'
import type { LocaleInfo } from './types'
import type { I18nNuxtContext } from './context'
import { generateLoaderOptions } from './gen'
import { generateTemplateNuxtI18nOptions } from './template'

export async function setupNitro(ctx: I18nNuxtContext, nuxt: Nuxt) {
  addServerTemplate({
    filename: '#internal/i18n-options.mjs',
    getContents: () => generateTemplateNuxtI18nOptions(ctx, generateLoaderOptions(ctx, nuxt), true),
  })

  addServerTemplate({
    filename: '#internal/i18n-route-resources.mjs',
    getContents: () => nuxt.vfs['#build/i18n-route-resources.mjs'] || '',
  })

  const localeDetectorPath = await resolveLocaleDetectorPath(ctx, nuxt)
  addServerTemplate({
    filename: '#internal/i18n-locale-detector.mjs',
    getContents: () =>
      localeDetectorPath
        ? `export { default as localeDetector } from ${JSON.stringify(localeDetectorPath)}`
        : `export const localeDetector = undefined`,
  })

  const sharedComposables = ctx.resolver.resolve('runtime/composables/shared')
  addServerImports([
    { name: 'defineI18nLocale', from: sharedComposables },
    { name: 'defineI18nConfig', from: sharedComposables },
    { name: 'defineI18nLocaleDetector', from: ctx.resolver.resolve('runtime/composables/server') },
  ])

  const h3UtilsExports = await resolveModuleExportNames(resolveModule('@intlify/utils/h3'))
  addServerImports([
    { name: 'useTranslation', from: '@intlify/h3' },
    ...h3UtilsExports.map(name => ({ name, from: '@intlify/utils/h3' })),
  ])

  // add nitro plugin
  addServerPlugin(ctx.resolver.resolve('runtime/server/plugin'))

  addServerHandler({
    route: `${ctx.options.serverRoutePrefix}/:hash/:locale/messages.json`,
    handler: ctx.resolver.resolve('./runtime/server/routes/messages'),
  })

  nuxt.hook('nitro:config', async (nitroConfig) => {
    // inline module runtime in Nitro bundle
    nitroConfig.externals = defu(nitroConfig.externals ?? {}, { inline: [ctx.resolver.resolve('./runtime'), ...new Set(ctx.localeInfo.flatMap(x => x.meta.map(m => m.path)))] })
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

    nitroConfig.replace = Object.assign({}, nitroConfig.replace, getDefineConfig(ctx, true))
  })
}

async function resolveLocaleDetectorPath(ctx: I18nNuxtContext, nuxt: Nuxt) {
  const detector = ctx.i18nLayers.find(l => !!l.i18nDetector)?.i18nDetector
  if (detector == null) { return '' }

  const resolved = await resolvePath(detector, { cwd: nuxt.options.rootDir, extensions: EXECUTABLE_EXTENSIONS })
  const exists = existsSync(resolved)
  if (!exists) {
    logger.warn(`localeDetector file '${resolved}' does not exist.`)
    return ''
  }

  return resolved
}

function getResourcePathsGrouped(localeInfo: LocaleInfo[]) {
  const groups: { yaml: string[], json5: string[] } = { yaml: [], json5: [] }
  for (const locale of localeInfo) {
    groups.yaml = groups.yaml.concat(locale.meta.filter(meta => /\.ya?ml$/.test(meta.path)).map(x => x.path))
    groups.json5 = groups.json5.concat(locale.meta.filter(meta => /\.json5?$/.test(meta.path)).map(x => x.path))
  }
  return groups
}
