import { findPath, useNuxt } from '@nuxt/kit'
import { getLayerI18n, getLocaleFiles, logger, mergeConfigLocales, resolveVueI18nConfigInfo } from './utils'

import { isAbsolute, resolve } from 'pathe'
import { assign, isString } from '@intlify/shared'
import { EXECUTABLE_EXTENSIONS } from './constants'

import type { LocaleConfig } from './utils'
import type { Nuxt } from '@nuxt/schema'
import type { FileMeta, LocaleObject, NuxtI18nOptions } from './types'
import type { I18nNuxtContext } from './context'

export function checkLayerOptions(_options: NuxtI18nOptions, nuxt: Nuxt) {
  const project = nuxt.options._layers[0]!
  const layers = nuxt.options._layers

  for (const layer of layers) {
    const layerI18n = getLayerI18n(layer)
    if (layerI18n == null) { continue }

    const configLocation = project.config.rootDir === layer.config.rootDir ? 'project' : 'extended'
    const layerHint = `In ${configLocation} layer (\`${resolve(project.config.rootDir, layer.configFile)}\`) -`

    try {
      if (!layerI18n.langDir) { continue }
      if (isString(layerI18n.langDir) && isAbsolute(layerI18n.langDir)) {
        logger.warn(
          `${layerHint} \`langDir\` is set to an absolute path (\`${layerI18n.langDir}\`) but should be set a path relative to \`srcDir\` (\`${layer.config.srcDir}\`). `
          + `Absolute paths will not work in production, see https://i18n.nuxtjs.org/docs/api/options#langdir for more details.`,
        )
      }

      for (const locale of layerI18n.locales ?? []) {
        if (isString(locale)) {
          throw new Error('When using the `langDir` option the `locales` must be a list of objects.')
        }
        if (locale.file || locale.files) { continue }
        throw new Error(
          'All locales must have the `file` or `files` property set when using `langDir`.\n'
          + `Found none in:\n${JSON.stringify(locale, null, 2)}.`,
        )
      }
    } catch (err) {
      if (!(err instanceof Error)) { throw err }
      throw new Error(`[nuxt-i18n] ${layerHint} ${err.message}`)
    }
  }
}

/**
 * Merges `locales` configured by each layer and resolves the locale `files` to absolute paths.
 */
export async function applyLayerOptions(ctx: I18nNuxtContext, nuxt: Nuxt) {
  const configs: LocaleConfig[] = []

  // collect `installModule` config, identified by absolute `langDir` and `locales` paths
  if (isAbsolute(ctx.options.langDir || '')) {
    const config: LocaleConfig<LocaleObject[]> = { langDir: ctx.options.langDir!, locales: [] }
    for (const locale of ctx.options.locales) {
      if (isString(locale) || !getLocaleFiles(locale)?.[0]?.path?.startsWith(config.langDir)) { continue }
      config.locales.push(locale)
    }
    configs.push(config)
  }

  // collect layer configs
  for (const layer of ctx.i18nLayers) {
    if (layer.i18n.locales == null) { continue }
    configs.push(assign({}, layer.i18n, { langDir: resolve(layer.i18nDir, layer.i18n.langDir ?? 'locales'), locales: layer.i18n.locales }))
  }

  // collect hook configs
  // @ts-expect-error - type issue only present within repo
  await nuxt.callHook('i18n:registerModule', ({ langDir, locales }) => langDir && locales && configs.push({ langDir, locales }))

  return mergeConfigLocales(configs)
}

export async function resolveLayerVueI18nConfigInfo(ctx: I18nNuxtContext, nuxt = useNuxt()) {
  const res: Omit<FileMeta, 'cache'>[] = []

  // collect `installModule` config
  if (ctx.options.vueI18n && isAbsolute(ctx.options.vueI18n)) {
    const resolved = await findPath(ctx.options.vueI18n, { extensions: EXECUTABLE_EXTENSIONS })

    if (resolved) {
      res.push(resolveVueI18nConfigInfo(resolved, nuxt.vfs))
    }
  }

  for (const layer of ctx.i18nLayers) {
    const resolved = await findPath(layer.i18n.vueI18n || 'i18n.config', { cwd: layer.i18nDir, extensions: EXECUTABLE_EXTENSIONS })

    if (!resolved) {
      if (import.meta.dev && layer.i18n.vueI18n) {
        logger.warn(`Vue I18n configuration file \`${layer.i18n.vueI18n}\` not found in \`${layer.i18nDir}\`. Skipping...`)
      }
      continue
    }

    res.push(resolveVueI18nConfigInfo(resolved, nuxt.vfs))
  }

  return res
}
