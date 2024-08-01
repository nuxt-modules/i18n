import createDebug from 'debug'
import {
  getLayerI18n,
  mergeConfigLocales,
  resolveVueI18nConfigInfo,
  formatMessage,
  getLocaleFiles,
  getProjectPath
} from './utils'

import { useLogger } from '@nuxt/kit'
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
    // const resolveFrom = isNuxtMajorVersion(4, nuxt) ? layer.config.rootDir : layer.config.srcDir
    if (layerI18n == null) continue

    const configLocation = project.config.rootDir === layer.config.rootDir ? 'project layer' : 'extended layer'
    const layerHint = `In ${configLocation} (\`${resolve(project.config.rootDir, layer.configFile)}\`) -`

    try {
      // check `lazy` and `langDir` option
      // if (layerI18n.lazy && !layerI18n.langDir) {
      //   throw new Error('When using the `lazy` option you must also set the `langDir` option.')
      // }

      // check `langDir` option
      if (layerI18n.langDir) {
        // const locales = layerI18n.locales || []

        // let langDir = resolve(layer.config.srcDir, layerI18n?.langDir ?? layer.config.srcDir)
        // if (layerI18n.restructure) {
        //   langDir = resolve(resolveFrom, layerI18n.rootDir ?? 'i18n', layerI18n.langDir ?? 'locales')
        // }
        // if (!locales.length || locales.some(locale => isString(locale))) {
        //   throw new Error('When using the `langDir` option the `locales` must be a list of objects.')
        // }

        if (isString(layerI18n.langDir) && isAbsolute(layerI18n.langDir)) {
          logger.warn(
            `${layerHint} \`langDir\` is set to an absolute path (\`${layerI18n.langDir}\`) but should be set a path relative to \`srcDir\` (\`${layer.config.srcDir}\`). ` +
              `Absolute paths will not work in production, see https://i18n.nuxtjs.org/options/lazy#langdir for more details.`
          )
        }

        // for (const locale of locales) {
        //   if (isString(locale) || !(locale.file || locale.files)) {
        //     throw new Error(
        //       'All locales must have the `file` or `files` property set when using `langDir`.\n' +
        //         `Found none in:\n${JSON.stringify(locale, null, 2)}.`
        //     )
        //   }
        // }
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

export function resolveI18nDir(layer: NuxtConfigLayer, i18n: NuxtI18nOptions, _nuxt: Nuxt, _server: boolean = false) {
  if (i18n.restructure) {
    return resolve(layer.config.rootDir, i18n.rootDir ?? 'i18n')
  }

  return resolve(layer.config.rootDir, _server ? '' : layer.config.srcDir)
}

export function resolveLayerLangDir(layer: NuxtConfigLayer, i18n: NuxtI18nOptions, nuxt: Nuxt) {
  return resolve(nuxt.options.rootDir, resolveI18nDir(layer, i18n, nuxt), i18n?.langDir ?? 'locales')
}

const mergeLayerLocales = (options: NuxtI18nOptions, nuxt: Nuxt) => {
  debug('project layer `lazy` option', options.lazy)
  const projectLangDir = getProjectPath(nuxt, nuxt.options.srcDir)
  options.locales ??= []

  const configs: LocaleConfig[] = []

  for (const layer of nuxt.options._layers) {
    const i18n = getLayerI18n(layer)
    if (i18n?.locales == null) continue

    configs.push({ ...i18n, langDir: resolveLayerLangDir(layer, i18n, nuxt), projectLangDir })
  }

  const absoluteConfigMap = new Map<string, LocaleConfig>()
  const absoluteLocaleObjects: LocaleObject[] = []

  // locale `files` use absolute paths installed using `installModule`
  outer: for (const locale of options.locales) {
    if (typeof locale === 'string') continue

    const files = getLocaleFiles(locale)
    if (files.length === 0) continue

    // check if all files are absolute and not present in configs
    for (const file of files) {
      if (!isAbsolute(file.path)) continue outer
      if (configs.find(config => config.langDir === parse(file.path).dir) != null) continue outer
    }

    absoluteLocaleObjects.push(locale)
  }

  // filter layer locales
  for (const absoluteLocaleObject of absoluteLocaleObjects) {
    const files = getLocaleFiles(absoluteLocaleObject)
    if (files.length === 0) continue

    const langDir = parse(files[0].path).dir
    const locales = (absoluteConfigMap.get(langDir)?.locales ?? []) as LocaleObject[]
    locales.push(absoluteLocaleObject)
    absoluteConfigMap.set(langDir, { langDir, projectLangDir, locales })
  }

  configs.unshift(...Array.from(absoluteConfigMap.values()))

  return mergeConfigLocales(configs)
}

/**
 * Returns an array of absolute paths to each layers `langDir`
 */
export const getLayerLangPaths = (nuxt: Nuxt) => {
  const langPaths: string[] = []

  for (const layer of nuxt.options._layers) {
    const i18n = getLayerI18n(layer)
    if (i18n?.langDir == null) continue

    langPaths.push(resolveLayerLangDir(layer, i18n, nuxt))
  }

  return langPaths
}

export async function resolveLayerVueI18nConfigInfo(options: NuxtI18nOptions, nuxt: Nuxt, buildDir: string) {
  const logger = useLogger(NUXT_I18N_MODULE_ID)

  const resolveArr = nuxt.options._layers.map(async layer => {
    const i18n = getLayerI18n(layer)
    if (i18n == null) return undefined

    const res = await resolveVueI18nConfigInfo(i18n || {}, buildDir, resolveI18nDir(layer, i18n, nuxt, true))

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
    resolved.unshift(await resolveVueI18nConfigInfo({ vueI18n: options.vueI18n }, buildDir, parse(options.vueI18n).dir))
  }

  return resolved.filter((x): x is Required<VueI18nConfigPathInfo> => x != null)
}
