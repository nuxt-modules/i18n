import createDebug from 'debug'
import { getLayerI18n, mergeConfigLocales, resolveVueI18nConfigInfo, formatMessage, getLocaleFiles } from './utils'

import { useLogger, useNuxt } from '@nuxt/kit'
import { isAbsolute, parse, resolve } from 'pathe'
import { assign, isString } from '@intlify/shared'
import { NUXT_I18N_MODULE_ID } from './constants'

import type { LocaleConfig } from './utils'
import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { LocaleObject, NuxtI18nOptions, VueI18nConfigPathInfo } from './types'

const debug = createDebug('@nuxtjs/i18n:layers')

export function checkLayerOptions(_options: NuxtI18nOptions, nuxt: Nuxt) {
  const logger = useLogger(NUXT_I18N_MODULE_ID)
  const project = nuxt.options._layers[0]
  const layers = nuxt.options._layers

  for (const layer of layers) {
    const layerI18n = getLayerI18n(layer)
    if (layerI18n == null) continue

    const configLocation = project.config.rootDir === layer.config.rootDir ? 'project' : 'extended'
    const layerHint = `In ${configLocation} layer (\`${resolve(project.config.rootDir, layer.configFile)}\`) -`

    try {
      // check `langDir` option
      if (layerI18n.langDir) {
        if (isString(layerI18n.langDir) && isAbsolute(layerI18n.langDir)) {
          logger.warn(
            `${layerHint} \`langDir\` is set to an absolute path (\`${layerI18n.langDir}\`) but should be set a path relative to \`srcDir\` (\`${layer.config.srcDir}\`). ` +
              `Absolute paths will not work in production, see https://i18n.nuxtjs.org/options/lazy#langdir for more details.`
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
      }
    } catch (err) {
      if (!(err instanceof Error)) throw err
      throw new Error(formatMessage(`${layerHint} ${err.message}`))
    }
  }
}

export function mergeLayerPages(analyzer: (pathOverride: string) => void, nuxt: Nuxt) {
  const project = nuxt.options._layers[0]
  const layers = nuxt.options._layers

  // No layers to merge
  if (layers.length === 1) return

  for (const l of layers) {
    const lPath = resolve(project.config.rootDir, l.config.srcDir, l.config.dir?.pages ?? 'pages')
    debug('mergeLayerPages: path ->', lPath)
    analyzer(lPath)
  }
}

export function resolveI18nDir(layer: NuxtConfigLayer, i18n: NuxtI18nOptions, fromRootDir: boolean = false) {
  if (i18n.restructureDir !== false) {
    return resolve(layer.config.rootDir, i18n.restructureDir ?? 'i18n')
  }
  return resolve(layer.config.rootDir, fromRootDir ? '' : layer.config.srcDir)
}

function resolveLayerLangDir(layer: NuxtConfigLayer, i18n: NuxtI18nOptions) {
  i18n.restructureDir ??= 'i18n'
  i18n.langDir ??= i18n.restructureDir !== false ? 'locales' : ''
  return resolve(resolveI18nDir(layer, i18n), i18n.langDir)
}

/**
 * Merges `locales` configured by each layer and resolves the locale `files` to absolute paths.
 * This overwrites `options.locales`
 */
export function applyLayerOptions(options: NuxtI18nOptions, nuxt: Nuxt) {
  options.locales ??= []

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
  outer: for (const locale of options.locales) {
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

  debug('merged locales', configs)
  options.locales = mergeConfigLocales(configs)
}

export async function resolveLayerVueI18nConfigInfo(options: NuxtI18nOptions) {
  const logger = useLogger(NUXT_I18N_MODULE_ID)
  const nuxt = useNuxt()

  const resolved = await Promise.all(
    nuxt.options._layers.map(async layer => {
      const i18n = getLayerI18n(layer)
      const i18nDirPath = resolveI18nDir(layer, i18n || {}, true)
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

  return resolved.filter((x): x is Required<VueI18nConfigPathInfo> => x != null)
}
