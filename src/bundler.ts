import createDebug from 'debug'
import { resolve } from 'pathe'
import { extendWebpackConfig, extendViteConfig, addWebpackPlugin, addVitePlugin } from '@nuxt/kit'
import VueI18nWebpackPlugin from '@intlify/unplugin-vue-i18n/webpack'
import VueI18nVitePlugin from '@intlify/unplugin-vue-i18n/vite'
import { TransformMacroPlugin, TransformMacroPluginOptions } from './macros'

import type { Nuxt } from '@nuxt/schema'
import type { NuxtI18nOptions } from './types'

const debug = createDebug('@nuxtjs/i18n:bundler')

export async function extendBundler(
  options: Required<NuxtI18nOptions>,
  nuxt: Nuxt,
  hasLocaleFiles: boolean,
  langPath: string | null
) {
  // setup nitro
  if (nuxt.options.nitro.replace) {
    nuxt.options.nitro.replace['__DEBUG__'] = options.debug
  } else {
    nuxt.options.nitro.replace = {
      __DEBUG__: options.debug
    }
  }
  debug('nitro.replace', nuxt.options.nitro.replace)

  // extract macros from components
  const macroOptions: TransformMacroPluginOptions = {
    dev: nuxt.options.dev,
    sourcemap: nuxt.options.sourcemap.server || nuxt.options.sourcemap.client,
    macros: {
      defineI18nRoute: 'i18n'
    }
  }

  try {
    // @ts-ignore NOTE: use webpack which is installed by nuxt
    const webpack = await import('webpack').then(m => m.default || m)

    // install webpack plugin
    if (hasLocaleFiles && langPath) {
      addWebpackPlugin(
        VueI18nWebpackPlugin({
          include: [resolve(langPath, './**')],
          runtimeOnly: true
        })
      )
    }

    addWebpackPlugin(TransformMacroPlugin.webpack(macroOptions))

    extendWebpackConfig(config => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- `config.plugins` is safe, so it's assigned with nuxt!
      config.plugins!.push(
        new webpack.DefinePlugin({
          __VUE_I18N_FULL_INSTALL__: 'true',
          __VUE_I18N_LEGACY_API__: 'true',
          __INTLIFY_PROD_DEVTOOLS__: 'false',
          __DEBUG__: JSON.stringify(options.debug)
        })
      )
    })
  } catch (e: unknown) {
    debug((e as Error).message)
  }

  // install vite plugin
  if (hasLocaleFiles && langPath) {
    addVitePlugin(
      VueI18nVitePlugin({
        include: [resolve(langPath, './**')],
        runtimeOnly: true
      })
    )
  }

  addVitePlugin(TransformMacroPlugin.vite(macroOptions))

  extendViteConfig(config => {
    if (config.define) {
      config.define['__DEBUG__'] = JSON.stringify(options.debug)
    } else {
      config.define = {
        __DEBUG__: JSON.stringify(options.debug)
      }
    }
    debug('vite.config.define', config.define)
  })
}
