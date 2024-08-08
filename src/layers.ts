import createDebug from 'debug'
import { getLayerI18n, mergeConfigLocales, resolveVueI18nConfigInfo, formatMessage, getLocaleFiles } from './utils'

import { useLogger, useNuxt } from '@nuxt/kit'
import { isAbsolute, parse, resolve } from 'pathe'
import { isString } from '@intlify/shared'
import { NUXT_I18N_MODULE_ID } from './constants'

import type { LocaleConfig } from './utils'
import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { LocaleObject, NuxtI18nOptions, VueI18nConfigPathInfo } from './types'

const debug = createDebug('@nuxtjs/i18n:layers')

export const checkLayerOptions = (_options: NuxtI18nOptions, nuxt: Nuxt) => {
  const logger = useLogger(NUXT_I18N_MODULE_ID)
  const project = nuxt.options._layers[0]
  const layers = nuxt.options._layers

  for (const layer of layers) {
    const layerI18n = getLayerI18n(layer)
    if (layerI18n == null) continue

    const configLocation = project.config.rootDir === layer.config.rootDir ? 'project layer' : 'extended layer'
    const layerHint = `In ${configLocation} (\`${resolve(project.config.rootDir, layer.configFile)}\`) -`

    try {
      // check `langDir` option
      if (layerI18n.langDir) {
        const locales = layerI18n.locales || []

        if (isString(layerI18n.langDir) && isAbsolute(layerI18n.langDir)) {
          logger.warn(
            `${layerHint} \`langDir\` is set to an absolute path (\`${layerI18n.langDir}\`) but should be set a path relative to \`srcDir\` (\`${layer.config.srcDir}\`). ` +
              `Absolute paths will not work in production, see https://i18n.nuxtjs.org/options/lazy#langdir for more details.`
          )
        }

        for (const locale of locales) {
          if (isString(locale)) {
            throw new Error('When using the `langDir` option the `locales` must be a list of objects.')
          }

          if (!(locale.file || locale.files)) {
            throw new Error(
              'All locales must have the `file` or `files` property set when using `langDir`.\n' +
                `Found none in:\n${JSON.stringify(locale, null, 2)}.`
            )
          }
        }
      }
    } catch (err) {
      if (!(err instanceof Error)) throw err
      throw new Error(formatMessage(`${layerHint} ${err.message}`))
    }
  }
}

/**
 * Merges `locales` configured by each layer and resolves the locale `files` to absolute paths.
 *
 * This overwrites `options.locales`
 */
export const applyLayerOptions = (options: NuxtI18nOptions, nuxt: Nuxt) => {
  const project = nuxt.options._layers[0]
  const layers = nuxt.options._layers

  const resolvedLayerPaths = layers.map(l => resolve(project.config.rootDir, l.config.rootDir))
  debug('using layers at paths', resolvedLayerPaths)

  const mergedLocales = mergeLayerLocales(options, nuxt)
  debug('merged locales', mergedLocales)

  options.locales = mergedLocales
}

export const mergeLayerPages = (analyzer: (pathOverride: string) => void, nuxt: Nuxt) => {
  const project = nuxt.options._layers[0]
  const layers = nuxt.options._layers

  // No layers to merge
  if (layers.length === 1) return

  for (const l of layers) {
    const lPath = resolve(project.config.rootDir, l.config.rootDir, l.config.dir?.pages ?? 'pages')
    debug('mergeLayerPages: path ->', lPath)
    analyzer(lPath)
  }
}

export function resolveI18nDir(layer: NuxtConfigLayer, i18n: NuxtI18nOptions, fromRootDir: boolean = false) {
  if (i18n.restructureDir) {
    return resolve(layer.config.rootDir, i18n.restructureDir)
  }

  return resolve(layer.config.rootDir, fromRootDir ? '' : layer.config.srcDir)
}

export function resolveLayerLangDir(layer: NuxtConfigLayer, i18n: NuxtI18nOptions) {
  const langDir = i18n.langDir ?? (i18n.restructureDir ? 'locales' : '')
  return resolve(resolveI18nDir(layer, i18n), langDir)
}

const mergeLayerLocales = (options: NuxtI18nOptions, nuxt: Nuxt) => {
  debug('project layer `lazy` option', options.lazy)
  options.locales ??= []

  const configs: LocaleConfig[] = []

  for (const layer of nuxt.options._layers) {
    const i18n = getLayerI18n(layer)
    if (i18n?.locales == null) continue

    configs.push({ ...i18n, langDir: resolveLayerLangDir(layer, i18n) })
  }

  const installModuleConfigMap = new Map<string, LocaleConfig>()

  /**
   * Collect any locale files that are not provided by layers these are added when
   * installing through `installModule` and should have absolute paths.
   */
  outer: for (const locale of options.locales) {
    if (typeof locale === 'string') continue

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

  configs.unshift(...Array.from(installModuleConfigMap.values()))

  return mergeConfigLocales(configs)
}

/**
 * Returns an array of absolute paths to each layers `langDir`
 */
export const getLayerLangPaths = (nuxt: Nuxt) => {
  const langPaths: string[] = []

  for (const layer of nuxt.options._layers) {
    const i18n = getLayerI18n(layer)
    if (!i18n?.restructureDir && i18n?.langDir == null) continue

    langPaths.push(resolveLayerLangDir(layer, i18n))
  }

  return langPaths
}

export async function resolveLayerVueI18nConfigInfo(options: NuxtI18nOptions) {
  const logger = useLogger(NUXT_I18N_MODULE_ID)
  const nuxt = useNuxt()

  const resolveArr = nuxt.options._layers.map(async layer => {
    const i18n = getLayerI18n(layer)
    if (i18n == null) return undefined

    const res = await resolveVueI18nConfigInfo(resolveI18nDir(layer, i18n, true), i18n.vueI18n)

    if (res == null && i18n?.vueI18n != null) {
      logger.warn(
        `Ignore Vue I18n configuration file does not exist at ${i18n.vueI18n} in ${layer.config.rootDir}. Skipping...`
      )
      return undefined
    }

    return res
  })

  const resolved = await Promise.all(resolveArr)

  // use `vueI18n` passed by `installModule`
  if (options.vueI18n && isAbsolute(options.vueI18n)) {
    resolved.unshift(await resolveVueI18nConfigInfo(parse(options.vueI18n).dir, options.vueI18n))
  }

  return resolved.filter((x): x is Required<VueI18nConfigPathInfo> => x != null)
}
