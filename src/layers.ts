import { useNuxt } from '@nuxt/kit'
import { getLayerI18n, mergeConfigLocales, resolveVueI18nConfigInfo, getLocaleFiles, logger } from './utils'

import { isAbsolute, parse, resolve } from 'pathe'
import { assign, isString } from '@intlify/shared'

import type { LocaleConfig } from './utils'
import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { FileMeta, LocaleObject, NuxtI18nOptions } from './types'
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

export function resolveI18nDir(layer: NuxtConfigLayer, i18n: NuxtI18nOptions) {
  return resolve(layer.config.rootDir, i18n.restructureDir ?? 'i18n')
}

function resolveLayerLangDir(layer: NuxtConfigLayer, i18n: NuxtI18nOptions) {
  return resolve(resolveI18nDir(layer, i18n), i18n.langDir ?? 'locales')
}

/**
 * Merges `locales` configured by each layer and resolves the locale `files` to absolute paths.
 * This overwrites `options.locales`
 */
export function applyLayerOptions(ctx: I18nNuxtContext, nuxt: Nuxt) {
  ctx.options.locales ??= []

  const configs: LocaleConfig[] = []
  for (const layer of nuxt.options._layers) {
    const i18n = getLayerI18n(layer)
    if (i18n?.locales == null) continue
    configs.push(assign({}, i18n, { langDir: resolveLayerLangDir(layer, i18n), locales: i18n.locales }))
  }

  /**
   * Collect any locale files that are not provided by layers these are added when
   * installing through `installModule` and should have absolute paths.
   */
  const installModuleConfigMap = new Map<string, LocaleConfig>()
  outer: for (const locale of ctx.options.locales) {
    if (isString(locale)) continue

    const files = getLocaleFiles(locale)
    if (files.length === 0) continue

    const langDir = parse(files[0].path).dir
    const locales = (installModuleConfigMap.get(langDir)?.locales ?? []) as LocaleObject[]

    // check if all files are absolute and not present in configs
    for (const file of files) {
      if (!isAbsolute(file.path)) continue outer
      if (configs.find(config => config.langDir === parse(file.path).dir) != null) continue outer
    }

    locales.push(locale)
    installModuleConfigMap.set(langDir, { langDir, locales })
  }

  configs.unshift(...installModuleConfigMap.values())

  ctx.options.locales = mergeConfigLocales(configs)
}

export async function resolveLayerVueI18nConfigInfo(options: NuxtI18nOptions, nuxt = useNuxt()) {
  const resolved = await Promise.all(
    nuxt.options._layers.map(async layer => {
      const i18n = getLayerI18n(layer)
      const i18nDirPath = resolveI18nDir(layer, i18n || {})
      const res = await resolveVueI18nConfigInfo(i18nDirPath, i18n?.vueI18n)

      if (res == null && i18n?.vueI18n != null) {
        logger.warn(`Vue I18n configuration file \`${i18n.vueI18n}\` not found in \`${i18nDirPath}\`. Skipping...`)
        return undefined
      }

      return res
    })
  )

  // use `vueI18n` passed by `installModule`
  if (options.vueI18n && isAbsolute(options.vueI18n)) {
    resolved.unshift(await resolveVueI18nConfigInfo(parse(options.vueI18n).dir, options.vueI18n))
  }

  return resolved.filter((x): x is Required<FileMeta> => x != null)
}
