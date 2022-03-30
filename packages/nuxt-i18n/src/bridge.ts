import { resolve } from 'pathe'
import { resolveModule, addPluginTemplate } from '@nuxt/kit'
import { distDir } from './dirs'

import type { Nuxt } from '@nuxt/schema'

export async function setupNuxtBridge(nuxt: Nuxt) {
  // resolve vue-i18n as vue-i18n-legacy
  nuxt.options.alias['vue-i18n'] = resolveModule('vue-i18n-legacy/dist/vue-i18n.esm.js', {
    paths: nuxt.options.modulesDir
  })
  nuxt.options.build.transpile.push('vue-i18n')

  // resolve vue-i18n-bridge as vue-i18n
  const vueI18nBridgePath = nuxt.options.dev
    ? 'vue-i18n-bridge/dist/vue-i18n-bridge.esm-bundler.js'
    : 'vue-i18n-bridge/dist/vue-i18n-bridge.runtime.esm-bundler.js'
  nuxt.options.alias['vue-i18n-bridge'] = resolveModule(vueI18nBridgePath, {
    paths: nuxt.options.modulesDir
  })
  nuxt.options.build.transpile.push('vue-i18n-bridge')

  addPluginTemplate({
    filename: 'runtime/bridge.plugin.mjs',
    src: resolve(distDir, 'runtime/bridge.plugin.mjs')
  })
}
