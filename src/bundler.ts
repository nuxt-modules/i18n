import createDebug from 'debug'
import { resolve } from 'pathe'
import { extendWebpackConfig, extendViteConfig, addWebpackPlugin, addVitePlugin } from '@nuxt/kit'
import VueI18nWebpackPlugin from '@intlify/unplugin-vue-i18n/webpack'
import VueI18nVitePlugin from '@intlify/unplugin-vue-i18n/vite'
import { TransformMacroPlugin } from './transform/macros'
import { ResourcePlugin } from './transform/resource'
import { TransformI18nFunctionPlugin } from './transform/i18n-function-injection'
import { assign } from '@intlify/shared'
import { getLayerLangPaths } from './layers'

import type { Nuxt } from '@nuxt/schema'
import type { PluginOptions } from '@intlify/unplugin-vue-i18n'
import type { NuxtI18nOptions } from './types'
import type { TransformMacroPluginOptions } from './transform/macros'
import type { ResourcePluginOptions } from './transform/resource'
import type { TransformI18nFunctionPluginOptions } from './transform/i18n-function-injection'

const debug = createDebug('@nuxtjs/i18n:bundler')

export async function extendBundler(nuxt: Nuxt, nuxtOptions: Required<NuxtI18nOptions>) {
  const langPaths = getLayerLangPaths(nuxt)
  debug('langPaths -', langPaths)
  const i18nModulePaths =
    nuxtOptions?.i18nModules?.map(module => resolve(nuxt.options._layers[0].config.rootDir, module.langDir ?? '')) ?? []
  debug('i18nModulePaths -', i18nModulePaths)
  const localePaths = [...langPaths, ...i18nModulePaths]

  // extract macros from components
  const macroOptions: TransformMacroPluginOptions = {
    sourcemap: !!nuxt.options.sourcemap.server || !!nuxt.options.sourcemap.client
  }

  const resourceOptions: ResourcePluginOptions = {
    sourcemap: !!nuxt.options.sourcemap.server || !!nuxt.options.sourcemap.client
  }

  const i18nFunctionOptions: TransformI18nFunctionPluginOptions = {
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
      escapeHtml: nuxtOptions.compilation.escapeHtml
    }

    if (localePaths.length > 0) {
      webpackPluginOptions.include = localePaths.map(x => resolve(x, './**'))
    }

    addWebpackPlugin(VueI18nWebpackPlugin(webpackPluginOptions))
    addWebpackPlugin(TransformMacroPlugin.webpack(macroOptions))
    addWebpackPlugin(ResourcePlugin.webpack(resourceOptions))
    if (nuxtOptions.experimental.autoImportTranslationFunctions) {
      addWebpackPlugin(TransformI18nFunctionPlugin.webpack(i18nFunctionOptions))
    }

    extendWebpackConfig(config => {
      config.plugins!.push(
        new webpack.DefinePlugin(
          assign(
            getFeatureFlags({
              compositionOnly: nuxtOptions.bundle.compositionOnly,
              fullInstall: nuxtOptions.bundle.fullInstall,
              dropMessageCompiler: nuxtOptions.bundle.dropMessageCompiler
            }),
            {
              __DEBUG__: String(nuxtOptions.debug)
            }
          )
        )
      )
    })
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
    globalSFCScope: nuxtOptions.customBlocks.globalSFCScope
  }
  if (localePaths.length > 0) {
    vitePluginOptions.include = localePaths.map(x => resolve(x, './**'))
  }

  addVitePlugin(VueI18nVitePlugin(vitePluginOptions))
  addVitePlugin(TransformMacroPlugin.vite(macroOptions))
  addVitePlugin(ResourcePlugin.vite(resourceOptions))
  if (nuxtOptions.experimental.autoImportTranslationFunctions) {
    addVitePlugin(TransformI18nFunctionPlugin.vite(i18nFunctionOptions))
  }

  extendViteConfig(config => {
    if (config.define) {
      config.define['__DEBUG__'] = JSON.stringify(nuxtOptions.debug)
    } else {
      config.define = {
        __DEBUG__: JSON.stringify(nuxtOptions.debug)
      }
    }
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
