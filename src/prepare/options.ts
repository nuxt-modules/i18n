import type { I18nNuxtContext } from '../context'
import type { Nuxt } from '@nuxt/schema'
import { logger } from '../utils'
import { checkLayerOptions } from '../layers'
import { isString } from '@intlify/shared'

export function prepareOptions(ctx: I18nNuxtContext, nuxt: Nuxt) {
  const { options, rawOptions } = ctx
  checkLayerOptions(ctx, nuxt)

  /**
   * Check conflicting options
   */
  if (options.bundle.compositionOnly && options.types === 'legacy') {
    throw new Error(
      '[nuxt-i18n] `bundle.compositionOnly` option and `types` option are conflicting: '
      + `bundle.compositionOnly: ${options.bundle.compositionOnly}, types: ${JSON.stringify(options.types)}`,
    )
  }

  if (rawOptions.autoDeclare && nuxt.options.imports.autoImport === false) {
    logger.warn(
      'Disabling `autoImports` in Nuxt is not compatible with `autoDeclare`, either enable `autoImports` or disable `autoDeclare`.',
    )
  }

  const { strategy, defaultLocale, multiDomainLocales } = options

  if (strategy.endsWith('_default') && !defaultLocale && !multiDomainLocales) {
    logger.warn(
      `The \`${strategy}\` i18n strategy${rawOptions.strategy == null ? ' (used by default)' : ''} needs \`defaultLocale\` to be set.`,
    )
  }

  if (multiDomainLocales) {
    const hasDomainLocales = (options.locales || []).some(locale => !isString(locale) && locale.domains?.length)

    if (!hasDomainLocales) {
      logger.warn(
        `Locale \`domains\` must be configured when \`multiDomainLocales\` is enabled.`,
      )
    }
  }

  if (nuxt.options.experimental.scanPageMeta === false) {
    logger.warn(
      'Route localization features (e.g. custom name, prefixed aliases) require Nuxt\'s `experimental.scanPageMeta` to be enabled.\nThis feature will be enabled in future Nuxt versions (https://github.com/nuxt/nuxt/pull/27134), check out the docs for more details: https://nuxt.com/docs/guide/going-further/experimental-features#scanpagemeta',
    )
  }

  if (options.experimental?.compactRoutes) {
    const conflicts: string[] = []
    if (strategy === 'no_prefix') { conflicts.push('`strategy: "no_prefix"`') }
    if (options.differentDomains) { conflicts.push('`differentDomains`') }
    if (multiDomainLocales) { conflicts.push('`multiDomainLocales`') }
    if (conflicts.length) {
      logger.warn(
        `\`experimental.compactRoutes\` is enabled but has no effect due to incompatible option(s): ${conflicts.join(', ')}. Routes will fall back to per-locale duplication.`,
      )
    }
  }
}
