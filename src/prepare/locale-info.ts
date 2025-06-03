import type { I18nNuxtContext } from '../context'
import type { Nuxt } from '@nuxt/schema'
import { isString } from '@intlify/shared'
import { applyLayerOptions, resolveLayerVueI18nConfigInfo } from '../layers'
import { filterLocales, resolveLocales } from '../utils'

export async function resolveLocaleInfo(ctx: I18nNuxtContext, nuxt: Nuxt) {
  /**
   * collect and merge locales from layers and module hooks
   */
  ctx.options.locales = await applyLayerOptions(ctx, nuxt)
  ctx.options.locales = filterLocales(ctx, nuxt)

  /**
   * resolve locale info
   */
  ctx.normalizedLocales = ctx.options.locales.map(x => (isString(x) ? { code: x, language: x } : x))
  ctx.localeCodes = ctx.normalizedLocales.map(locale => locale.code)
  ctx.localeInfo = resolveLocales(nuxt.options.srcDir, ctx.normalizedLocales)

  /**
   * resolve vue-i18n config path
   */
  ctx.vueI18nConfigPaths = await resolveLayerVueI18nConfigInfo(ctx.options)
}
