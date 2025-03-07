/* eslint-disable @typescript-eslint/no-floating-promises */
import createDebug from 'debug'
import { resolve } from 'pathe'
import { extendViteConfig, addWebpackPlugin, addBuildPlugin, addTemplate, addRspackPlugin } from '@nuxt/kit'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n'
import { toArray } from './utils'
import { TransformMacroPlugin } from './transform/macros'
import { ResourcePlugin } from './transform/resource'
import { TransformI18nFunctionPlugin } from './transform/i18n-function-injection'
import { asI18nVirtual } from './transform/utils'
import { getLayerLangPaths } from './layers'

import type { Nuxt } from '@nuxt/schema'
import type { PluginOptions } from '@intlify/unplugin-vue-i18n'
import type { BundlerPluginOptions } from './transform/utils'
import type { I18nNuxtContext } from './context'

const debug = createDebug('@nuxtjs/i18n:bundler')

export async function extendBundler(ctx: I18nNuxtContext, nuxt: Nuxt) {
  const { options: nuxtOptions } = ctx
  const langPaths = getLayerLangPaths(nuxt)
  debug('langPaths -', langPaths)
  const i18nModulePaths =
    nuxtOptions?.i18nModules?.map(module => resolve(nuxt.options._layers[0].config.rootDir, module.langDir ?? '')) ?? []
  debug('i18nModulePaths -', i18nModulePaths)
  const localePaths = [...langPaths, ...i18nModulePaths]
  const localeIncludePaths = localePaths.length ? localePaths.map(x => resolve(x, './**')) : undefined

  const sourceMapOptions: BundlerPluginOptions = {
    sourcemap: !!nuxt.options.sourcemap.server || !!nuxt.options.sourcemap.client
  }

  addTemplate({
    write: true,
    filename: 'nuxt-i18n-logger.mjs',
    getContents() {
      if (!ctx.options.debug && !nuxt.options._i18nTest) {
        return `export function createLogger() {}`
      }

      return `
import { createConsola } from 'consola'

const debugLogger = createConsola({ level: ${ctx.options.debug === 'verbose' ? 999 : 4} }).withTag('i18n')

export function createLogger(label) {
  return debugLogger.withTag(label)
}`
    }
  })

  nuxt.options.alias[asI18nVirtual('logger')] = ctx.resolver.resolve(nuxt.options.buildDir, './nuxt-i18n-logger.mjs')

  /**
   * shared plugins (nuxt/nitro)
   */
  const resourcePlugin = ResourcePlugin(sourceMapOptions, ctx)

  addBuildPlugin(resourcePlugin)

  nuxt.hook('nitro:config', async cfg => {
    cfg.rollupConfig!.plugins = (await cfg.rollupConfig!.plugins) || []
    cfg.rollupConfig!.plugins = toArray(cfg.rollupConfig!.plugins)

    cfg.rollupConfig!.plugins.push(resourcePlugin.rollup())
  })

  /**
   * shared plugins (webpack/vite)
   */
  const vueI18nPluginOptions: PluginOptions = {
    allowDynamic: true,
    include: localeIncludePaths,
    runtimeOnly: nuxtOptions.bundle.runtimeOnly,
    fullInstall: nuxtOptions.bundle.fullInstall,
    onlyLocales: nuxtOptions.bundle.onlyLocales,
    escapeHtml: nuxtOptions.compilation.escapeHtml,
    compositionOnly: nuxtOptions.bundle.compositionOnly,
    strictMessage: nuxtOptions.compilation.strictMessage,
    defaultSFCLang: nuxtOptions.customBlocks.defaultSFCLang,
    globalSFCScope: nuxtOptions.customBlocks.globalSFCScope,
    dropMessageCompiler: nuxtOptions.bundle.dropMessageCompiler,
    optimizeTranslationDirective: nuxtOptions.bundle.optimizeTranslationDirective
  }
  addBuildPlugin({
    vite: () => VueI18nPlugin.vite(vueI18nPluginOptions),
    webpack: () => VueI18nPlugin.webpack(vueI18nPluginOptions)
  })
  addBuildPlugin(TransformMacroPlugin(sourceMapOptions))
  if (nuxtOptions.experimental.autoImportTranslationFunctions) {
    addBuildPlugin(TransformI18nFunctionPlugin(sourceMapOptions))
  }

  /**
   * webpack plugin
   */
  try {
    const webpack = await import('webpack').then(m => m.default || m)

    addWebpackPlugin(
      new webpack.DefinePlugin({
        ...getFeatureFlags(nuxtOptions.bundle),
        __DEBUG__: String(!!nuxtOptions.debug),
        __TEST__: String(!!nuxtOptions.debug || nuxt.options._i18nTest)
      })
    )
  } catch (e: unknown) {
    debug((e as Error).message)
  }

  /**
   * rspack plugin
   */
  try {
    const { rspack } = await import('@rspack/core')

    addRspackPlugin(
      new rspack.DefinePlugin({
        ...getFeatureFlags(nuxtOptions.bundle),
        __DEBUG__: String(!!nuxtOptions.debug),
        __TEST__: String(!!nuxtOptions.debug || nuxt.options._i18nTest)
      })
    )
  } catch (e: unknown) {
    debug((e as Error).message)
  }

  /**
   * vite plugin
   */
  extendViteConfig(config => {
    config.define ??= {}
    config.define['__DEBUG__'] = JSON.stringify(!!nuxtOptions.debug)
    config.define['__TEST__'] = String(!!nuxtOptions.debug || nuxt.options._i18nTest)

    debug('vite.config.define', config.define)
  })
}

export function getFeatureFlags({ compositionOnly = true, fullInstall = true, dropMessageCompiler = false }) {
  return {
    __VUE_I18N_FULL_INSTALL__: String(fullInstall),
    __VUE_I18N_LEGACY_API__: String(!compositionOnly),
    __INTLIFY_PROD_DEVTOOLS__: 'false',
    __INTLIFY_DROP_MESSAGE_COMPILER__: String(dropMessageCompiler)
  }
}
