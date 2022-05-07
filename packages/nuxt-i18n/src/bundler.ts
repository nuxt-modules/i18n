import createDebug from 'debug'
import { resolve } from 'pathe'
import { extendWebpackConfig, addWebpackPlugin, addVitePlugin } from '@nuxt/kit'
import VueI18nWebpackPlugin from '@intlify/unplugin-vue-i18n/webpack'
import VueI18nVitePlugin from '@intlify/unplugin-vue-i18n/vite'

const debug = createDebug('@nuxtjs/i18n:bundler')

export async function extendBundler(hasLocaleFiles: boolean, langPath: string | null) {
  try {
    // @ts-ignore NOTE: use webpack which is installed by nuxt
    const webpack = await import('webpack').then(m => m.default || m)

    // install webpack plugin
    if (hasLocaleFiles && langPath) {
      addWebpackPlugin(
        VueI18nWebpackPlugin({
          include: [resolve(langPath, './**')]
        })
      )
    }

    extendWebpackConfig(config => {
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

  // install vite plugin
  if (hasLocaleFiles && langPath) {
    addVitePlugin(
      VueI18nVitePlugin({
        include: [resolve(langPath, './**')]
      })
    )
  }
}
