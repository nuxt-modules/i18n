import type { I18nNuxtContext } from '../context'
import type { Nuxt } from '@nuxt/schema'
import { relative } from 'pathe'

export function prepareBuildManifest({ localeInfo }: I18nNuxtContext, nuxt: Nuxt) {
  nuxt.hook('build:manifest', (manifest) => {
    const langFiles = localeInfo
      .flatMap(locale => locale.meta.map(m => m.path))
      .map(x => relative(nuxt.options.srcDir, x))
    const langPaths = [...new Set(langFiles)]

    for (const key in manifest) {
      if (langPaths.some(x => key.startsWith(x))) {
        manifest[key]!.prefetch = false
        manifest[key]!.preload = false
      }
    }
  })
}
