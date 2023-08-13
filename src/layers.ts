import createDebug from 'debug'
import {
  getLayerI18n,
  getProjectPath,
  mergeConfigLocales,
  resolveVueI18nConfigInfo,
  LocaleConfig,
  formatMessage
} from './utils'

import { useLogger } from '@nuxt/kit'
import { isAbsolute, resolve } from 'pathe'
import { isString } from '@intlify/shared'
import { NUXT_I18N_MODULE_ID } from './constants'

import type { Nuxt } from '@nuxt/schema'
import type { NuxtI18nOptions } from './types'

const debug = createDebug('@nuxtjs/i18n:layers')

export const checkLayerOptions = (options: NuxtI18nOptions, nuxt: Nuxt) => {
  const logger = useLogger(NUXT_I18N_MODULE_ID)
  const project = nuxt.options._layers[0]
  const layers = nuxt.options._layers

  for (const layer of layers) {
    const layerI18n = getLayerI18n(layer)
    if (layerI18n == null) continue

    const configLocation = project.config.rootDir === layer.config.rootDir ? 'project layer' : 'extended layer'
    const layerHint = `In ${configLocation} (\`${resolve(project.config.rootDir, layer.configFile)}\`) -`

    try {
      // check `lazy` and `langDir` option
      if (layerI18n.lazy && !layerI18n.langDir) {
        throw new Error('When using the `lazy` option you must also set the `langDir` option.')
      }

      // check `langDir` option
      if (layerI18n.langDir) {
        const locales = layerI18n.locales || []
        if (!locales.length || locales.some(locale => isString(locale))) {
          throw new Error('When using the `langDir` option the `locales` must be a list of objects.')
        }

        if (isString(layerI18n.langDir) && isAbsolute(layerI18n.langDir)) {
          logger.warn(
            `${layerHint} \`langDir\` is set to an absolute path (\`${layerI18n.langDir}\`) but should be set a path relative to \`srcDir\` (\`${layer.config.srcDir}\`). ` +
              `Absolute paths will not work in production, see https://v8.i18n.nuxtjs.org/options/lazy#langdir for more details.`
          )
        }

        for (const locale of locales) {
          if (isString(locale) || !(locale.file || locale.files)) {
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

export const mergeLayerLocales = (options: NuxtI18nOptions, nuxt: Nuxt) => {
  debug('project layer `lazy` option', options.lazy)
  const projectLangDir = getProjectPath(nuxt, nuxt.options.srcDir)
  options.locales ??= []

  const configs: LocaleConfig[] = nuxt.options._layers
    .filter(layer => {
      const i18n = getLayerI18n(layer)
      return i18n?.locales != null
    })
    .map(layer => {
      const i18n = getLayerI18n(layer)
      return {
        ...i18n,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        langDir: resolve(layer.config.srcDir, i18n?.langDir ?? layer.config.srcDir),
        projectLangDir
      }
    })

  return mergeConfigLocales(configs)
}

/**
 * Returns an array of absolute paths to each layers `langDir`
 */
export const getLayerLangPaths = (nuxt: Nuxt) => {
  return nuxt.options._layers
    .filter(layer => {
      const i18n = getLayerI18n(layer)
      return i18n?.langDir != null
    })
    .map(layer => {
      const i18n = getLayerI18n(layer)
      // @ts-ignore
      return resolve(layer.config.srcDir, i18n.langDir)
    }) as string[]
}

export async function resolveLayerVueI18nConfigInfo(nuxt: Nuxt, buildDir: string) {
  if (nuxt.options._layers.length === 1) {
    return []
  }

  const layers = [...nuxt.options._layers]
  layers.shift()
  return await Promise.all(
    layers.map(layer => {
      const i18n = getLayerI18n(layer)
      return resolveVueI18nConfigInfo(i18n || {}, buildDir, layer.config.rootDir)
    })
  )
}
