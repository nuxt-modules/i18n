import { resolveModule } from '@nuxt/kit'
import { pkgModulesDir } from './dirs'

import type { Nuxt } from '@nuxt/schema'

export async function setupAlias(nuxt: Nuxt) {
  // resolve vue-i18@v9
  const vueI18nPath = nuxt.options.dev
    ? 'vue-i18n/dist/vue-i18n.esm-bundler.js'
    : 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'
  nuxt.options.alias['vue-i18n'] = resolveModule(vueI18nPath, {
    paths: nuxt.options.modulesDir
  })
  nuxt.options.build.transpile.push('vue-i18n')

  // resolve @intlify/shared
  nuxt.options.alias['@intlify/shared'] = resolveModule('@intlify/shared/dist/shared.esm-bundler.mjs', {
    paths: nuxt.options.modulesDir
  })
  nuxt.options.build.transpile.push('@intlify/shared')

  // resolve @intlify/vue-router-bridge
  nuxt.options.alias['@intlify/vue-router-bridge'] = resolveModule('@intlify/vue-router-bridge/lib/index.mjs', {
    paths: [pkgModulesDir, ...nuxt.options.modulesDir]
  })
  nuxt.options.build.transpile.push('@intlify/vue-router-bridge')

  // resolve @intlify/vue-i18n-bridge
  nuxt.options.alias['@intlify/vue-i18n-bridge'] = resolveModule('@intlify/vue-i18n-bridge/lib/index.mjs', {
    paths: [pkgModulesDir, ...nuxt.options.modulesDir]
  })
  nuxt.options.build.transpile.push('@intlify/vue-i18n-bridge')

  // resolve vue-i18n-routing
  nuxt.options.alias['vue-i18n-routing'] = resolveModule('vue-i18n-routing/dist/vue-i18n-routing.mjs', {
    paths: [pkgModulesDir, ...nuxt.options.modulesDir]
  })
  nuxt.options.build.transpile.push('vue-i18n-routing')
}
