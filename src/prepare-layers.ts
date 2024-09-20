import type { I18nNuxtContext } from './context'
import type { Nuxt } from '@nuxt/schema'
import { applyLayerOptions } from './layers'
import { filterLocales, mergeI18nModules } from './utils'

export async function prepareLayers({ options }: I18nNuxtContext, nuxt: Nuxt) {
  applyLayerOptions(options, nuxt)
  await mergeI18nModules(options, nuxt)
  filterLocales(options, nuxt)
}
