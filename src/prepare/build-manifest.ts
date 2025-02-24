import type { I18nNuxtContext } from '../context'
import type { Nuxt } from '@nuxt/schema'
import { getLocaleFiles } from '../utils'
import { relative } from 'pathe'

export function prepareBuildManifest({ options, localeInfo }: I18nNuxtContext, nuxt: Nuxt) {
  nuxt.hook('build:manifest', manifest => {
    if (!options.lazy) return

    const langFiles = localeInfo
      .flatMap(locale => getLocaleFiles(locale))
      .map(x => relative(nuxt.options.srcDir, x.path))
    const langPaths = [...new Set(langFiles)]

    for (const key in manifest) {
      if (langPaths.some(x => key.startsWith(x))) {
        manifest[key].prefetch = false
        manifest[key].preload = false
      }
    }
  })
}
