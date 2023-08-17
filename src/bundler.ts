import createDebug from 'debug'
import { resolve } from 'pathe'
import { extendWebpackConfig, extendViteConfig, addWebpackPlugin, addVitePlugin } from '@nuxt/kit'
import VueI18nWebpackPlugin from '@intlify/unplugin-vue-i18n/webpack'
import VueI18nVitePlugin from '@intlify/unplugin-vue-i18n/vite'
import { TransformMacroPlugin, TransformMacroPluginOptions } from './transform/macros'
import { ResourcePlugin, ResourcePluginOptions } from './transform/resource'
import { assign } from '@intlify/shared'
import { getLayerLangPaths } from './layers'

import type { Nuxt } from '@nuxt/schema'
import type { PluginOptions } from '@intlify/unplugin-vue-i18n'
import type { NuxtI18nOptions } from './types'

const debug = createDebug('@nuxtjs/i18n:bundler')

export async function extendBundler(
  nuxt: Nuxt,
  options: {
    nuxtOptions: Required<NuxtI18nOptions>
    hasLocaleFiles: boolean
  }
) {
  const { nuxtOptions, hasLocaleFiles } = options
  const langPaths = getLayerLangPaths(nuxt)
  debug('langPaths -', langPaths)
  const i18nModulePaths =
    nuxtOptions?.i18nModules?.map(module => resolve(nuxt.options._layers[0].config.rootDir, module.langDir ?? '')) ?? []
  debug('i18nModulePaths -', i18nModulePaths)
  const localePaths = [...langPaths, ...i18nModulePaths]

  // extract macros from components
  const macroOptions: TransformMacroPluginOptions = {
    sourcemap: nuxt.options.sourcemap.server || nuxt.options.sourcemap.client
  }

  const resourceOptions: ResourcePluginOptions = {
    sourcemap: nuxt.options.sourcemap.server || nuxt.options.sourcemap.client
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
      jitCompilation: nuxtOptions.compilation.jit,
      strictMessage: nuxtOptions.compilation.strictMessage,
      escapeHtml: nuxtOptions.compilation.escapeHtml
    }

    if (hasLocaleFiles && localePaths.length > 0) {
      webpackPluginOptions.include = localePaths.map(x => resolve(x, './**'))
    }

    addWebpackPlugin(VueI18nWebpackPlugin(webpackPluginOptions))
    addWebpackPlugin(TransformMacroPlugin.webpack(macroOptions))
    addWebpackPlugin(ResourcePlugin.webpack(resourceOptions))

    extendWebpackConfig(config => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- `config.plugins` is safe, so it's assigned with nuxt!
      config.plugins!.push(
        new webpack.DefinePlugin(
          assign(
            getFeatureFlags({
              jit: nuxtOptions.compilation.jit,
              compositionOnly: nuxtOptions.bundle.compositionOnly,
              fullInstall: nuxtOptions.bundle.fullInstall
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
    jitCompilation: nuxtOptions.compilation.jit,
    strictMessage: nuxtOptions.compilation.strictMessage,
    escapeHtml: nuxtOptions.compilation.escapeHtml,
    defaultSFCLang: nuxtOptions.customBlocks.defaultSFCLang,
    globalSFCScope: nuxtOptions.customBlocks.globalSFCScope
  }
  if (hasLocaleFiles && localePaths.length > 0) {
    vitePluginOptions.include = localePaths.map(x => resolve(x, './**'))
  }

  addVitePlugin(VueI18nVitePlugin(vitePluginOptions))
  addVitePlugin(TransformMacroPlugin.vite(macroOptions))
  addVitePlugin(ResourcePlugin.vite(resourceOptions))

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

export function getFeatureFlags({ jit = true, compositionOnly = true, fullInstall = true }) {
  return {
    __VUE_I18N_FULL_INSTALL__: String(fullInstall),
    __VUE_I18N_LEGACY_API__: String(!compositionOnly),
    __INTLIFY_PROD_DEVTOOLS__: 'false',
    __INTLIFY_JIT_COMPILATION__: String(jit)
  }
}
