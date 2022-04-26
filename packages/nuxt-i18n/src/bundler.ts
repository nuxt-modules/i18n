import createDebug from 'debug'
import { resolve } from 'pathe'
import { vueI18n } from '@intlify/vite-plugin-vue-i18n'
import { extendViteConfig, extendWebpackConfig } from '@nuxt/kit'

type VitePluginOptions = Parameters<typeof vueI18n>[0]

const debug = createDebug('@nuxtjs/i18n:bundler')

export async function extendBundler(hasLocaleFiles: boolean, langPath: string | null) {
  try {
    // @ts-ignore NOTE: use webpack which is installed by nuxt
    const webpack = await import('webpack').then(m => m.default || m)

    // TODO: vue-i18n-loader cannot be resolved as i18n resources which compiled by the intlify message compiler ...
    extendWebpackConfig(config => {
      if (hasLocaleFiles && langPath) {
        config.module!.rules!.push({
          test: /\.(json5?|ya?ml)$/,
          type: 'javascript/auto',
          loader: '@intlify/vue-i18n-loader',
          include: [resolve(langPath, './**')]
        })
      }

      config.module!.rules!.push({
        resourceQuery: /blockType=i18n/,
        type: 'javascript/auto',
        loader: '@intlify/vue-i18n-loader'
      })

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- `config.plugins` is safe, so it's assigned with nuxt!
      config.plugins!.push(
        new webpack.DefinePlugin({
          __VUE_I18N_FULL_INSTALL__: 'true',
          __VUE_I18N_LEGACY_API__: 'true',
          __INTLIFY_PROD_DEVTOOLS__: 'false'
        })
      )
    })
  } catch (e: unknown) {
    debug((e as Error).message)
  }

  // install @intlify/vite-plugin-vue-i18n
  extendViteConfig(config => {
    const viteOptions: VitePluginOptions = {
      compositionOnly: false
    }
    if (hasLocaleFiles && langPath) {
      viteOptions['include'] = resolve(langPath, './**')
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- `config.plugins` is safe, so it's assigned with nuxt!
    config.plugins!.push(vueI18n(viteOptions))
  })
}
