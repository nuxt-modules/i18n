import { resolveModuleExportNames } from 'mlly'
import { defu } from 'defu'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { addServerHandler, addServerImports, addServerPlugin, addServerTemplate, resolveModule, resolvePath } from '@nuxt/kit'
import yamlPlugin from '@rollup/plugin-yaml'
import json5Plugin from '@miyaneee/rollup-plugin-json5'
import { getDefineConfig } from './bundler'
import { readStaticResource } from './resources'
import { join, relative } from 'pathe'
import { logger, toArray } from './utils'
import { EXECUTABLE_EXTENSIONS } from './constants'

import type { Plugin } from 'rollup'
import type { Nitro } from 'nitropack'
import type { Nuxt } from '@nuxt/schema'
import type { FileMeta } from './types'
import type { ResolvedI18nContext } from './context'
import { generateTemplateNuxtI18nOptions } from './template'

export async function setupNitro(ctx: ResolvedI18nContext, nuxt: Nuxt) {
  addServerTemplate({
    filename: '#internal/i18n-options.mjs',
    getContents: () => generateTemplateNuxtI18nOptions(ctx, true),
  })

  // resources with an `assetKey` ship as message assets read lazily at runtime (see
  // `generateLoaderOptions`) - keeps message data out of the nitro bundle and its build memory
  const assetFiles = new Map(ctx.localeFileMetas.filter(meta => meta.assetKey).map(meta => [meta.assetKey!, meta.path]))
  if (assetFiles.size) {
    const assetsDir = join(nuxt.options.buildDir, 'i18n-assets')
    const assetSources = new Map<string, string>()
    // read right before the nitro build - the build dir is cleaned after `modules:done` - and kept
    // for the prerender build, which renders from a nitro of its own
    nuxt.hook('nitro:build:before', () => {
      for (const [assetKey, path] of assetFiles) {
        assetSources.set(assetKey, readStaticResource(ctx, path))
      }
    })

    // nitro can only ship a server asset by embedding it in the bundle, which for message data is
    // most of the nitro build - the assets are emitted next to the server entry and read back with
    // `readFile` instead, only targets without a filesystem keep the embed. The preset deciding
    // that resolves after `nitro:config`, so each build answers from its own resolved options.
    const setupAssetDelivery = (nitro: Nitro) => setupMessageAssets(nitro, assetsDir, assetSources)
    nuxt.hook('nitro:init', (nitro) => {
      setupAssetDelivery(nitro)
      nitro.hooks.hook('prerender:init', setupAssetDelivery)
    })
  }

  addServerTemplate({
    filename: '#internal/i18n-route-resources.mjs',
    getContents: () => nuxt.vfs['#build/i18n-route-resources.mjs'] || '',
  })

  const localeDetector = await resolveLocaleDetectorPath(ctx, nuxt)
  addServerTemplate({
    filename: '#internal/i18n-locale-detector.mjs',
    getContents: () =>
      localeDetector.exists
        ? `export { default as localeDetector } from ${JSON.stringify(localeDetector.path)}`
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
    nitroConfig.externals = defu(nitroConfig.externals ?? {}, { inline: [ctx.resolver.resolve('./runtime'), ...ctx.localeFilePaths] })
    nitroConfig.alias!['#i18n'] = ctx.resolver.resolve('./runtime/composables/index-server')

    // type the locale detector file in the server tsconfig, where `#i18n` resolves server composables
    if (localeDetector.path) {
      const relativeDetectorPath = relative(nuxt.options.buildDir, localeDetector.path)
      nuxt.options.typescript.tsConfig.exclude ||= []
      nuxt.options.typescript.tsConfig.exclude.push(relativeDetectorPath)
      nitroConfig.typescript = defu(nitroConfig.typescript ?? {}, { tsConfig: { include: [relativeDetectorPath] } })
    }

    nitroConfig.rollupConfig!.plugins = (await nitroConfig.rollupConfig!.plugins) || []
    nitroConfig.rollupConfig!.plugins = toArray(nitroConfig.rollupConfig!.plugins)

    const localePathsByType = getResourcePathsGrouped(ctx.localeFileMetas)
    // install server resource transform plugin for yaml / json5 format
    if (localePathsByType.yaml.length > 0) {
      nitroConfig.rollupConfig!.plugins.push(yamlPlugin({ include: localePathsByType.yaml }))
    }

    if (localePathsByType.json5.length > 0) {
      nitroConfig.rollupConfig!.plugins.push(json5Plugin({ include: localePathsByType.json5 }))
    }

    // the prerender pass builds its own nitro from this config, so this is the only place reaching
    // it - but it runs before the preset is applied, so `staticDeploy` is stale here. Server code
    // reads what derives from it (`__IS_SSG__`, `__I18N_CDN__`) from the app graph instead.
    nitroConfig.replace = Object.assign({}, nitroConfig.replace, getDefineConfig(ctx, true))
  })
}

/** Ships message assets as files this build emits, or embedded when it has no filesystem to read */
function setupMessageAssets(nitro: Nitro, assetsDir: string, sources: Map<string, string>) {
  nitro.options.replace.__I18N_FS_ASSETS__ = String(nitro.options.node)

  if (nitro.options.node) {
    nitro.options.rollupConfig!.plugins = [...toArray(nitro.options.rollupConfig!.plugins as Plugin[]), emitI18nAssets(sources)]
    return
  }

  // nitro embeds what it finds on disk, so this build needs the assets written out
  nitro.hooks.hook('build:before', () => {
    rmSync(assetsDir, { recursive: true, force: true })
    mkdirSync(assetsDir, { recursive: true })
    for (const [assetKey, source] of sources) {
      writeFileSync(join(assetsDir, assetKey), source)
    }
  })
  nitro.options.serverAssets.push({ baseName: 'i18n', dir: assetsDir })
}

/** Emits message assets into the server output, next to the entry `readI18nAsset` resolves against */
function emitI18nAssets(sources: Map<string, string>): Plugin {
  return {
    name: 'nuxtjs:i18n-assets',
    generateBundle() {
      for (const [assetKey, source] of sources) {
        this.emitFile({ type: 'asset', fileName: `i18n-assets/${assetKey}`, source })
      }
    },
  }
}

async function resolveLocaleDetectorPath(ctx: ResolvedI18nContext, nuxt: Nuxt) {
  const detector = ctx.i18nLayers.find(l => !!l.i18nDetector)?.i18nDetector
  if (detector == null) { return { path: '', exists: false } }

  const resolved = await resolvePath(detector, { cwd: nuxt.options.rootDir, extensions: EXECUTABLE_EXTENSIONS })
  const exists = existsSync(resolved)
  if (!exists) {
    logger.warn(`localeDetector file '${resolved}' does not exist.`)
  }

  return { path: resolved, exists }
}

function getResourcePathsGrouped(fileMetas: FileMeta[]) {
  return {
    yaml: fileMetas.filter(meta => /\.ya?ml$/.test(meta.path)).map(x => x.path),
    json5: fileMetas.filter(meta => /\.json5?$/.test(meta.path)).map(x => x.path),
  }
}
