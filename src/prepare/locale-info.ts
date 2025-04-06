import type { I18nNuxtContext } from '../context'
import type { Nuxt } from '@nuxt/schema'
import { filterLocales, getNormalizedLocales, mergeI18nModules, resolveLocales } from '../utils'
import { applyLayerOptions, resolveLayerVueI18nConfigInfo } from '../layers'

export async function resolveLocaleInfo(ctx: I18nNuxtContext, nuxt: Nuxt) {
  const { options, debug } = ctx

  /**
   * collect and merge locales from layers and module hooks
   */
  applyLayerOptions(options, nuxt)
  await mergeI18nModules(options, nuxt)
  filterLocales(options, nuxt)

  /**
   * resolve locale info
   */
  const normalizedLocales = getNormalizedLocales(options.locales)
  const localeCodes = normalizedLocales.map(locale => locale.code)
  const localeInfo = resolveLocales(nuxt.options.srcDir, normalizedLocales, nuxt.options.buildDir)
  debug('localeInfo', localeInfo)

  /**
   * resolve vue-i18n config path
   */
  const vueI18nConfigPaths = await resolveLayerVueI18nConfigInfo(options)
  debug('VueI18nConfigPaths', vueI18nConfigPaths)

  ctx.normalizedLocales = normalizedLocales
  ctx.localeCodes = localeCodes
  ctx.localeInfo = localeInfo
  ctx.vueI18nConfigPaths = vueI18nConfigPaths
}
