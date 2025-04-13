import type { I18nNuxtContext } from '../context'
import type { Nuxt } from '@nuxt/schema'

export function prepareStrategy({ options, normalizedLocales }: I18nNuxtContext, nuxt: Nuxt) {
  if (options.strategy === 'prefix' && nuxt.options._generate) {
    const localizedEntryPages = normalizedLocales.map(x => ['/', x.code].join(''))
    nuxt.hook('nitro:config', config => {
      config.prerender ??= {}

      // ignore `/` which is added by nitro by default
      config.prerender.ignore ??= []
      config.prerender.ignore.push(/^\/$/)

      // add localized routes as entry pages for prerendering
      config.prerender.routes ??= []
      config.prerender.routes.push(...localizedEntryPages)
    })
  }
}
