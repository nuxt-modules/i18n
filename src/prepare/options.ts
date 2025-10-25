import type { I18nNuxtContext } from '../context'
import type { Nuxt } from '@nuxt/schema'
import { logger } from '../utils'
import { checkLayerOptions } from '../layers'

export function prepareOptions({ options }: I18nNuxtContext, nuxt: Nuxt) {
  checkLayerOptions(options, nuxt)

  /**
   * Check conflicting options
   */
  if (options.bundle.compositionOnly && options.types === 'legacy') {
    throw new Error(
      '[nuxt-i18n] `bundle.compositionOnly` option and `types` option are conflicting: '
      + `bundle.compositionOnly: ${options.bundle.compositionOnly}, types: ${JSON.stringify(options.types)}`,
    )
  }

  if (nuxt.options.i18n?.autoDeclare && nuxt.options.imports.autoImport === false) {
    logger.warn(
      'Disabling `autoImports` in Nuxt is not compatible with `autoDeclare`, either enable `autoImports` or disable `autoDeclare`.',
    )
  }

  const strategy = nuxt.options.i18n?.strategy || options.strategy
  const defaultLocale = nuxt.options.i18n?.defaultLocale || options.defaultLocale
  if (strategy.endsWith('_default') && !defaultLocale) {
    logger.warn(
      `The \`${strategy}\` i18n strategy${nuxt.options.i18n?.strategy == null ? ' (used by default)' : ''} needs \`defaultLocale\` to be set.`,
    )
  }

  if (nuxt.options.experimental.scanPageMeta === false) {
    logger.warn(
      'Route localization features (e.g. custom name, prefixed aliases) require Nuxt\'s `experimental.scanPageMeta` to be enabled.\nThis feature will be enabled in future Nuxt versions (https://github.com/nuxt/nuxt/pull/27134), check out the docs for more details: https://nuxt.com/docs/guide/going-further/experimental-features#scanpagemeta',
    )
  }
}
