import type { I18nNuxtContext } from '../context'
import type { Nuxt } from '@nuxt/schema'
import { applyOptionOverrides, formatMessage } from '../utils'
import { checkLayerOptions } from '../layers'

export function prepareOptions({ debug, logger, options }: I18nNuxtContext, nuxt: Nuxt) {
  applyOptionOverrides(options, nuxt)
  debug('options', options)
  checkLayerOptions(options, nuxt)

  /**
   * Check conflicting options
   */
  if (options.bundle.compositionOnly && options.types === 'legacy') {
    throw new Error(
      formatMessage(
        '`bundle.compositionOnly` option and `types` option are conflicting: ' +
          `bundle.compositionOnly: ${options.bundle.compositionOnly}, types: ${JSON.stringify(options.types)}`
      )
    )
  }

  if (
    !nuxt.options?._prepare &&
    !nuxt.options?.test &&
    nuxt.options.i18n?.bundle?.optimizeTranslationDirective == null
  ) {
    logger.warn(
      '`bundle.optimizeTranslationDirective` is enabled by default, we recommend disabling this feature as it causes issues and will be deprecated in v10.\nExplicitly setting this option to `true` or `false` disables this warning, for more details see: https://github.com/nuxt-modules/i18n/issues/3238#issuecomment-2672492536'
    )
  }

  if (options.experimental.autoImportTranslationFunctions && nuxt.options.imports.autoImport === false) {
    logger.warn(
      'Disabling `autoImports` in Nuxt is not compatible with `experimental.autoImportTranslationFunctions`, either enable `autoImports` or disable `experimental.autoImportTranslationFunctions`.'
    )
  }

  if (nuxt.options.experimental.scanPageMeta === false) {
    logger.warn(
      "Route localization features (e.g. custom name, prefixed aliases) require Nuxt's `experimental.scanPageMeta` to be enabled.\nThis feature will be enabled in future Nuxt versions (https://github.com/nuxt/nuxt/pull/27134), check out the docs for more details: https://nuxt.com/docs/guide/going-further/experimental-features#scanpagemeta"
    )
  }
}
