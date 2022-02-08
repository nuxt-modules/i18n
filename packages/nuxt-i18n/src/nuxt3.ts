import createDebug from 'debug'
import { resolve } from 'pathe'
import { resolveModule, addPluginTemplate, extendWebpackConfig } from '@nuxt/kit'
import { distDir } from './dirs'

import type { Nuxt } from '@nuxt/schema'
import type { NuxtI18nOptions } from './types'

const debug = createDebug('@nuxtjs/i18n:nuxt3')

export async function setupNuxt3(options: NuxtI18nOptions, nuxt: Nuxt) {
  // TODO:
  // Resolve vue-i18n
  nuxt.options.alias['vue-i18n'] = resolveModule('vue-i18n/dist/vue-i18n.esm-bundler.js', {
    paths: nuxt.options.modulesDir
  })
  nuxt.options.build.transpile.push('vue-i18n')

  // Resolve vue-i18n-routing
  nuxt.options.alias['vue-i18n-routing'] = resolveModule('vue-i18n-routing/dist/vue-i18n-routing.es.js', {
    paths: nuxt.options.modulesDir
  })
  nuxt.options.build.transpile.push('vue-i18n-routing')

  addPluginTemplate({
    filename: 'runtime/nuxt3.plugin.mjs',
    src: resolve(distDir, 'runtime/nuxt3.plugin.mjs')
  })
}
