import createDebug from 'debug'
import { resolve } from 'pathe'
import { extendWebpackConfig, extendViteConfig, addWebpackPlugin, addVitePlugin } from '@nuxt/kit'
import VueI18nWebpackPlugin from '@intlify/unplugin-vue-i18n/webpack'
import VueI18nVitePlugin from '@intlify/unplugin-vue-i18n/vite'
import { TransformMacroPlugin, TransformMacroPluginOptions } from './macros'

import type { Nuxt } from '@nuxt/schema'
import type { NuxtI18nOptions } from './types'
import type { PluginOptions } from '@intlify/unplugin-vue-i18n'

const debug = createDebug('@nuxtjs/i18n:bundler')

export async function extendBundler(
  nuxt: Nuxt,
  options: {
    nuxtOptions: Required<NuxtI18nOptions>
    hasLocaleFiles: boolean
    langPath: string | null
  }
) {
  const { nuxtOptions, hasLocaleFiles, langPath } = options

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

  // extract macros from components
  const macroOptions: TransformMacroPluginOptions = {
    dev: nuxt.options.dev,
    sourcemap: nuxt.options.sourcemap.server || nuxt.options.sourcemap.client
  }

  /**
   * webpack plugin
   */

  try {
    // @ts-ignore NOTE: use webpack which is installed by nuxt
    const webpack = await import('webpack').then(m => m.default || m)

    const webpackPluginOptions: PluginOptions = {
      runtimeOnly: true
    }
    if (hasLocaleFiles && langPath) {
      webpackPluginOptions.include = [resolve(langPath, './**')]
    }
    addWebpackPlugin(VueI18nWebpackPlugin(webpackPluginOptions))

    addWebpackPlugin(TransformMacroPlugin.webpack(macroOptions))

    extendWebpackConfig(config => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- `config.plugins` is safe, so it's assigned with nuxt!
      config.plugins!.push(
        new webpack.DefinePlugin({
          __VUE_I18N_FULL_INSTALL__: 'true',
          __VUE_I18N_LEGACY_API__: 'true',
          __INTLIFY_PROD_DEVTOOLS__: 'false',
          __DEBUG__: JSON.stringify(nuxtOptions.debug)
        })
      )
    })
  } catch (e: unknown) {
    debug((e as Error).message)
  }

  /**
   * vite plugin
   */

  const vitePluginOptions: PluginOptions = {
    runtimeOnly: true
  }
  if (hasLocaleFiles && langPath) {
    vitePluginOptions.include = [resolve(langPath, './**')]
  }
  addVitePlugin(VueI18nVitePlugin(vitePluginOptions))

  addVitePlugin(TransformMacroPlugin.vite(macroOptions))

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
