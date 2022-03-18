import { resolve } from 'pathe'
import { resolveModule, addPluginTemplate, addTemplate } from '@nuxt/kit'
import { distDir } from './dirs'

import type { Nuxt } from '@nuxt/schema'

export async function setupNuxt3(nuxt: Nuxt) {
  // resolve @intlify/shared
  const sharedPath = `@intlify/shared/dist/shared.cjs${nuxt.options.dev ? '' : '.prod'}.js`
  nuxt.options.alias['@intlify/shared'] = resolveModule(sharedPath, {
    paths: nuxt.options.modulesDir
  })
  nuxt.options.build.transpile.push('@intlify/shared')

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
