import type { Nuxt } from '@nuxt/schema'

export function prepareVite(nuxt: Nuxt) {
  // Optimize vue-i18n to ensure we share the same symbol
  nuxt.options.vite.optimizeDeps = nuxt.options.vite.optimizeDeps || {}
  nuxt.options.vite.optimizeDeps.exclude = nuxt.options.vite.optimizeDeps.exclude || []
  nuxt.options.vite.optimizeDeps.exclude.push('vue-i18n')
}
