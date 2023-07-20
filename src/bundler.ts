import createDebug from 'debug'
import { resolve } from 'pathe'
import { extendWebpackConfig, extendViteConfig, addWebpackPlugin, addVitePlugin } from '@nuxt/kit'
import VueI18nWebpackPlugin from '@intlify/unplugin-vue-i18n/webpack'
import VueI18nVitePlugin from '@intlify/unplugin-vue-i18n/vite'
import { TransformMacroPlugin, TransformMacroPluginOptions } from './transform/macros'
import { ResourceProxyPlugin, ResourceProxyPluginOptions } from './transform/proxy'
import { ResourceDynamicPlugin, ResourceDynamicPluginOptions } from './transform/dynamic'
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
    langPath: string | null
  }
) {
  const { nuxtOptions, hasLocaleFiles } = options
  const langPaths = getLayerLangPaths(nuxt)
  debug('langPaths -', langPaths)
  const i18nModulePaths =
    nuxt.options._layers[0].config.i18n?.i18nModules?.map(module =>
      resolve(nuxt.options._layers[0].config.rootDir, module.langDir ?? '')
    ) ?? []
  debug('i18nModulePaths -', i18nModulePaths)
  const localePaths = [...langPaths, ...i18nModulePaths]

  /**
   * setup nitro
   */

  if (nuxt.options.nitro.replace) {
    nuxt.options.nitro.replace['__DEBUG__'] = nuxtOptions.debug
  } else {
    nuxt.options.nitro.replace = {
      __DEBUG__: nuxtOptions.debug
    }
  }
  debug('nitro.replace', nuxt.options.nitro.replace)

  const proxyOptions: ResourceProxyPluginOptions = {
    sourcemap: nuxt.options.sourcemap.server || nuxt.options.sourcemap.client
  }

  // extract macros from components
  const macroOptions: TransformMacroPluginOptions = {
    sourcemap: nuxt.options.sourcemap.server || nuxt.options.sourcemap.client
  }

  const dynamicOptions: ResourceDynamicPluginOptions = {
    sourcemap: nuxt.options.sourcemap.server || nuxt.options.sourcemap.client
  }

  /**
   * webpack plugin
   */

  try {
    // @ts-ignore NOTE: use webpack which is installed by nuxt
    const webpack = await import('webpack').then(m => m.default || m)

    const webpackPluginOptions: PluginOptions = {
      runtimeOnly: true,
      allowDynamic: true,
      jitCompilation: nuxtOptions.compilation.jit,
      strictMessage: nuxtOptions.compilation.strictMessage,
      escapeHtml: nuxtOptions.compilation.escapeHtml
    }

    if (hasLocaleFiles && localePaths.length > 0) {
      webpackPluginOptions.include = localePaths.map(x => resolve(x, './**'))
    }

    addWebpackPlugin(ResourceProxyPlugin.webpack(proxyOptions))
    addWebpackPlugin(VueI18nWebpackPlugin(webpackPluginOptions))
    addWebpackPlugin(TransformMacroPlugin.webpack(macroOptions))
    addWebpackPlugin(ResourceDynamicPlugin.webpack(dynamicOptions))

    extendWebpackConfig(config => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- `config.plugins` is safe, so it's assigned with nuxt!
      config.plugins!.push(
        new webpack.DefinePlugin(
          assign(getFeatureFlags(nuxtOptions.compilation.jit), { __DEBUG__: String(nuxtOptions.debug) })
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
    runtimeOnly: true,
    allowDynamic: true,
    jitCompilation: nuxtOptions.compilation.jit,
    strictMessage: nuxtOptions.compilation.strictMessage,
    escapeHtml: nuxtOptions.compilation.escapeHtml
  }
  if (hasLocaleFiles && localePaths.length > 0) {
    vitePluginOptions.include = localePaths.map(x => resolve(x, './**'))
  }

  addVitePlugin(ResourceProxyPlugin.vite(proxyOptions))
  addVitePlugin(VueI18nVitePlugin(vitePluginOptions))
  addVitePlugin(TransformMacroPlugin.vite(macroOptions))
  addVitePlugin(ResourceDynamicPlugin.vite(dynamicOptions))

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

export function getFeatureFlags(jit = true) {
  return {
    __VUE_I18N_FULL_INSTALL__: 'true',
    __VUE_I18N_LEGACY_API__: 'true',
    __INTLIFY_PROD_DEVTOOLS__: 'false',
    __INTLIFY_JIT_COMPILATION__: String(jit)
  }
}
