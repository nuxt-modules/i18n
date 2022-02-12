import { resolve } from 'pathe'
import { vueI18n } from '@intlify/vite-plugin-vue-i18n'
import { extendViteConfig, extendWebpackConfig } from '@nuxt/kit'

type VitePluginOptions = Parameters<typeof vueI18n>[0]

export async function extendBundler(hasLocaleFiles: boolean, langPath: string) {
  // TODO: extend webpack loader
  /*
  // install @intlify/vue-i18n-loader
  extendWebpackConfig(config => {
    if (hasLocaleFiles) {
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

    // TODO: unplugin implementation
    // config.plugins?.push(webpack.DefinePlugin, [
    //   {
    //     __VUE_I18N_LEGACY_API__: legacyApiFlag,
    //     __VUE_I18N_FULL_INSTALL__: installFlag,
    //     __VUE_I18N_PROD_DEVTOOLS__: 'false'
    //   }
    // ])
  })
  */

  // install @intlify/vite-plugin-vue-i18n
  extendViteConfig(config => {
    const viteOptions: VitePluginOptions = {
      compositionOnly: false
    }
    if (hasLocaleFiles) {
      viteOptions['include'] = resolve(langPath, './**')
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- `config.plugins` is safe, so it's assigned with nuxt!
    config.plugins!.push(vueI18n(viteOptions))
  })
}
