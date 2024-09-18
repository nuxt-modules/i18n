import createDebug from 'debug'
import { resolve } from 'pathe'
import { extendViteConfig, addWebpackPlugin, addVitePlugin } from '@nuxt/kit'
import VueI18nWebpackPlugin from '@intlify/unplugin-vue-i18n/webpack'
import VueI18nVitePlugin from '@intlify/unplugin-vue-i18n/vite'
import { TransformMacroPlugin } from './transform/macros'
import { ResourcePlugin } from './transform/resource'
import { TransformI18nFunctionPlugin } from './transform/i18n-function-injection'
import { getLayerLangPaths } from './layers'

import type { Nuxt } from '@nuxt/schema'
import type { PluginOptions } from '@intlify/unplugin-vue-i18n'
import type { NuxtI18nOptions } from './types'
import type { BundlerPluginOptions } from './transform/utils'

const debug = createDebug('@nuxtjs/i18n:bundler')

export async function extendBundler(nuxt: Nuxt, nuxtOptions: Required<NuxtI18nOptions>) {
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

  /**
   * webpack plugin
   */

  try {
    // @ts-ignore NOTE: use webpack which is installed by nuxt
    const webpack = await import('webpack').then(m => m.default || m)

    const webpackPluginOptions: PluginOptions = {
      allowDynamic: true,
      runtimeOnly: nuxtOptions.bundle.runtimeOnly,
      compositionOnly: nuxtOptions.bundle.compositionOnly,
      onlyLocales: nuxtOptions.bundle.onlyLocales,
      dropMessageCompiler: nuxtOptions.bundle.dropMessageCompiler,
      optimizeTranslationDirective: true,
      strictMessage: nuxtOptions.compilation.strictMessage,
      escapeHtml: nuxtOptions.compilation.escapeHtml,
      include: localeIncludePaths
    }

    addWebpackPlugin(VueI18nWebpackPlugin(webpackPluginOptions))
    addWebpackPlugin(TransformMacroPlugin.webpack(sourceMapOptions))
    addWebpackPlugin(ResourcePlugin.webpack(sourceMapOptions))
    if (nuxtOptions.experimental.autoImportTranslationFunctions) {
      addWebpackPlugin(TransformI18nFunctionPlugin.webpack(sourceMapOptions))
    }
    addWebpackPlugin(
      new webpack.DefinePlugin({
        ...getFeatureFlags(nuxtOptions.bundle),
        __DEBUG__: String(!!nuxtOptions.debug)
      })
    )
  } catch (e: unknown) {
    debug((e as Error).message)
  }

  /**
   * vite plugin
   */

  const vitePluginOptions: PluginOptions = {
    allowDynamic: true,
    runtimeOnly: nuxtOptions.bundle.runtimeOnly,
    compositionOnly: nuxtOptions.bundle.compositionOnly,
    fullInstall: nuxtOptions.bundle.fullInstall,
    onlyLocales: nuxtOptions.bundle.onlyLocales,
    dropMessageCompiler: nuxtOptions.bundle.dropMessageCompiler,
    optimizeTranslationDirective: true,
    strictMessage: nuxtOptions.compilation.strictMessage,
    escapeHtml: nuxtOptions.compilation.escapeHtml,
    defaultSFCLang: nuxtOptions.customBlocks.defaultSFCLang,
    globalSFCScope: nuxtOptions.customBlocks.globalSFCScope,
    include: localeIncludePaths
  }

  addVitePlugin(VueI18nVitePlugin(vitePluginOptions))
  addVitePlugin(TransformMacroPlugin.vite(sourceMapOptions))
  addVitePlugin(ResourcePlugin.vite(sourceMapOptions))
  if (nuxtOptions.experimental.autoImportTranslationFunctions) {
    addVitePlugin(TransformI18nFunctionPlugin.vite(sourceMapOptions))
  }

  extendViteConfig(config => {
    config.define ??= {}
    config.define['__DEBUG__'] = JSON.stringify(!!nuxtOptions.debug)

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
