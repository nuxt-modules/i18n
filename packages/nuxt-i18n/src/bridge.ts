import createDebug from 'debug'
import { createRequire } from 'module'
import { resolve } from 'pathe'
import { resolveModule, addPluginTemplate, extendWebpackConfig } from '@nuxt/kit'
import { distDir } from './dirs'
import webpack from 'webpack'

import type { Nuxt } from '@nuxt/schema'
import type { NuxtI18nOptions } from './types'

const debug = createDebug('@nuxtjs/i18n:bridge')

export async function setupNuxtBridge(options: NuxtI18nOptions, nuxt: Nuxt) {
  const _require = createRequire(import.meta.url)

  // Resolve vue-i18n
  nuxt.options.alias['vue-i18n'] = resolveModule('vue-i18n-legacy/dist/vue-i18n.esm.js', {
    paths: nuxt.options.modulesDir
  })
  nuxt.options.build.transpile.push('vue-i18n')

  // Resolve vue-i18n-routing
  nuxt.options.alias['vue-i18n-routing'] = resolveModule('vue-i18n-routing/dist/vue-i18n-routing.es.js', {
    paths: nuxt.options.modulesDir
  })
  nuxt.options.build.transpile.push('vue-i18n-routing')

  // Resolve vue-i18n-bridge
  nuxt.options.alias['vue-i18n-bridge'] = resolveModule('vue-i18n-bridge/dist/vue-i18n-bridge.esm-bundler.js', {
    paths: nuxt.options.modulesDir
  })
  nuxt.options.build.transpile.push('vue-i18n-bridge')

  // // Resolve vue-router via `@intlify/vue-router-bridge`
  // nuxt.options.alias['vue-router'] = resolveModule('@intlify/vue-router-bridge/lib/index.mjs', {
  //   paths: nuxt.options.modulesDir
  // })
  // nuxt.options.build.transpile.push('vue-router')

  // // Resolve vue-i18n via `@intlify/vue-i18n-bridge`
  // nuxt.options.alias['vue-i18n'] = resolveModule('@intlify/vue-i18n-bridge/lib/index.mjs', {
  //   paths: nuxt.options.modulesDir
  // })
  // nuxt.options.build.transpile.push('vue-i18n')

  addPluginTemplate({
    filename: 'runtime/bridge.plugin.mjs',
    src: resolve(distDir, 'runtime/bridge.plugin.mjs')
  })

  extendWebpackConfig(config => {
    config.plugins!.push(
      new webpack.DefinePlugin({
        __VUE_I18N_FULL_INSTALL__: 'true',
        __VUE_I18N_LEGACY_API__: 'true',
        __INTLIFY_PROD_DEVTOOLS__: 'false'
      })
    )
  })
}
