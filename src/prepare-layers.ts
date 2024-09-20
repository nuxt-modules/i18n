import type { I18nNuxtContext } from '~/src/context'
import type { Nuxt } from '@nuxt/schema'
import { applyLayerOptions } from '~/src/layers'
import { filterLocales, mergeI18nModules } from '~/src/utils'

export async function prepareLayers({ options }: I18nNuxtContext, nuxt: Nuxt) {
  applyLayerOptions(options, nuxt)
  await mergeI18nModules(options, nuxt)
  filterLocales(options, nuxt)
}
