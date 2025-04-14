import type { I18nNuxtContext } from '../context'
import type { Nuxt } from '@nuxt/schema'
import { debug, filterLocales, getNormalizedLocales, mergeI18nModules, resolveLocales } from '../utils'
import { applyLayerOptions, resolveLayerVueI18nConfigInfo } from '../layers'

export async function resolveLocaleInfo(ctx: I18nNuxtContext, nuxt: Nuxt) {
  /**
   * collect and merge locales from layers and module hooks
   */
  applyLayerOptions(ctx, nuxt)
  await mergeI18nModules(ctx, nuxt)
  filterLocales(ctx, nuxt)

  /**
   * resolve locale info
   */
  ctx.normalizedLocales = getNormalizedLocales(ctx.options.locales)
  ctx.localeCodes = ctx.normalizedLocales.map(locale => locale.code)
  ctx.localeInfo = resolveLocales(nuxt.options.srcDir, ctx.normalizedLocales)
  debug('localeInfo', ctx.localeInfo)

  /**
   * resolve vue-i18n config path
   */
  ctx.vueI18nConfigPaths = await resolveLayerVueI18nConfigInfo(ctx.options)
  debug('VueI18nConfigPaths', ctx.vueI18nConfigPaths)
}
