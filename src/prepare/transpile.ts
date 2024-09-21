import type { Nuxt } from '@nuxt/schema'

export function prepareTranspile(nuxt: Nuxt) {
  // https://github.com/nuxt/framework/issues/5257
  nuxt.options.build.transpile.push('@nuxtjs/i18n')
  nuxt.options.build.transpile.push('@nuxtjs/i18n-edge')
}
