import { resolve } from 'pathe'
import { resolveModule, addPluginTemplate } from '@nuxt/kit'
import { distDir } from './dirs'

import type { Nuxt } from '@nuxt/schema'

export async function setupNuxt3(nuxt: Nuxt) {
  // resolve vue-i18n
  const vueI18nPath = nuxt.options.dev
    ? 'vue-i18n/dist/vue-i18n.esm-bundler.js'
    : 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'
  nuxt.options.alias['vue-i18n'] = resolveModule(vueI18nPath, {
    paths: nuxt.options.modulesDir
  })
  nuxt.options.build.transpile.push('vue-i18n')

  addPluginTemplate({
    filename: 'runtime/nuxt3.plugin.mjs',
    src: resolve(distDir, 'runtime/nuxt3.plugin.mjs')
  })
}
