import { isNuxt2 } from '@nuxt/kit'

import type { Nuxt } from '@nuxt/schema'

export async function setupAutoImports(nuxt: Nuxt) {
  // TOOD: resolve type definitions
  // register auto imports
  /*
  nuxt.hook('autoImports:extend', autoImports => {
    ;['useI18nHead', 'getRouteBaseName', 'localePath', 'localeRoute', 'localeLocation', 'switchLocalePath'].forEach(
      key => {
        autoImports.push({
          name: key,
          as: key,
          from: 'vue-i18n-routing'
        })
      }
    )
    autoImports.push({
      name: 'useI18n',
      as: 'useI18n',
      from: isNuxt2(nuxt) ? 'vue-i18n-bridge' : 'vue-i18n'
    })
  })
  */
}
