import type { I18nNuxtContext } from '../context'
import type { Nuxt } from '@nuxt/schema'
import { applyOptionOverrides, debug, formatMessage, logger } from '../utils'
import { checkLayerOptions } from '../layers'

export function prepareOptions({ options }: I18nNuxtContext, nuxt: Nuxt) {
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

  if (nuxt.options.i18n?.autoDeclare && nuxt.options.imports.autoImport === false) {
    logger.warn(
      'Disabling `autoImports` in Nuxt is not compatible with `autoDeclare`, either enable `autoImports` or disable `autoDeclare`.'
    )
  }

  if (nuxt.options.experimental.scanPageMeta === false) {
    logger.warn(
      "Route localization features (e.g. custom name, prefixed aliases) require Nuxt's `experimental.scanPageMeta` to be enabled.\nThis feature will be enabled in future Nuxt versions (https://github.com/nuxt/nuxt/pull/27134), check out the docs for more details: https://nuxt.com/docs/guide/going-further/experimental-features#scanpagemeta"
    )
  }
}
