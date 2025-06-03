import { useNuxt } from '@nuxt/kit'
import { getLayerI18n, mergeConfigLocales, resolveVueI18nConfigInfo, getLocaleFiles, logger } from './utils'

import { isAbsolute, parse, resolve } from 'pathe'
import { assign, isString } from '@intlify/shared'

import type { LocaleConfig } from './utils'
import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { FileMeta, LocaleObject, LocaleType, NuxtI18nOptions } from './types'
import type { I18nNuxtContext } from './context'

export function checkLayerOptions(_options: NuxtI18nOptions, nuxt: Nuxt) {
  const project = nuxt.options._layers[0]
  const layers = nuxt.options._layers

  for (const layer of layers) {
    const layerI18n = getLayerI18n(layer)
    if (layerI18n == null) continue

    const configLocation = project.config.rootDir === layer.config.rootDir ? 'project' : 'extended'
    const layerHint = `In ${configLocation} layer (\`${resolve(project.config.rootDir, layer.configFile)}\`) -`

    try {
      if (!layerI18n.langDir) continue
      if (isString(layerI18n.langDir) && isAbsolute(layerI18n.langDir)) {
        logger.warn(
          `${layerHint} \`langDir\` is set to an absolute path (\`${layerI18n.langDir}\`) but should be set a path relative to \`srcDir\` (\`${layer.config.srcDir}\`). ` +
            `Absolute paths will not work in production, see https://i18n.nuxtjs.org/docs/api/options#langdir for more details.`
        )
      }

      for (const locale of layerI18n.locales ?? []) {
        if (isString(locale)) {
          throw new Error('When using the `langDir` option the `locales` must be a list of objects.')
        }
        if (locale.file || locale.files) continue
        throw new Error(
          'All locales must have the `file` or `files` property set when using `langDir`.\n' +
            `Found none in:\n${JSON.stringify(locale, null, 2)}.`
        )
      }
    } catch (err) {
      if (!(err instanceof Error)) throw err
      throw new Error(`[nuxt-i18n] ${layerHint} ${err.message}`)
    }
  }
}

export function resolveI18nDir(layer: NuxtConfigLayer, i18n: NuxtI18nOptions, i18nDir = i18n.restructureDir ?? 'i18n') {
  return resolve(layer.config.rootDir, i18nDir)
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
      if (isString(locale) || !getLocaleFiles(locale)?.[0]?.path?.startsWith(config.langDir)) continue
      config.locales.push(locale)
    }
    configs.push(config)
  }

  // collect layer configs
  for (const layer of nuxt.options._layers) {
    const i18n = getLayerI18n(layer)
    if (i18n?.locales == null) continue

    const langDir = resolve(resolveI18nDir(layer, i18n), i18n.langDir ?? 'locales')
    configs.push(assign({}, i18n, { langDir, locales: i18n.locales }))
  }

  // collect hook configs
  await nuxt.callHook(
    'i18n:registerModule',
    ({ langDir, locales }) => langDir && locales && configs.push({ langDir, locales })
  )

  return mergeConfigLocales(configs)
}

export async function resolveLayerVueI18nConfigInfo(options: NuxtI18nOptions, nuxt = useNuxt()) {
  const resolvers: Promise<{ path: string; hash: string; type: LocaleType } | undefined>[] = []

  // collect `installModule` config
  if (options.vueI18n && isAbsolute(options.vueI18n)) {
    resolvers.push(resolveVueI18nConfigInfo(parse(options.vueI18n).dir, options.vueI18n))
  }

  for (const layer of nuxt.options._layers) {
    resolvers.push(resolveLayerVueI18n(layer))
  }

  return (await Promise.all(resolvers)).filter((x): x is Required<FileMeta> => x != null)
}

async function resolveLayerVueI18n(layer: NuxtConfigLayer) {
  const i18n = getLayerI18n(layer)
  const i18nDir = resolveI18nDir(layer, i18n || {})
  const resolved = await resolveVueI18nConfigInfo(i18nDir, i18n?.vueI18n)

  if (import.meta.dev && resolved == null && i18n?.vueI18n) {
    logger.warn(`Vue I18n configuration file \`${i18n.vueI18n}\` not found in \`${i18nDir}\`. Skipping...`)
  }

  return resolved
}
