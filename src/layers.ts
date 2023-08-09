import createDebug from 'debug'
import { getLayerI18n, getProjectPath, mergeConfigLocales, resolveVueI18nConfigInfo, LocaleConfig } from './utils'

import type { Nuxt } from '@nuxt/schema'
import type { NuxtI18nOptions } from './types'

const debug = createDebug('@nuxtjs/i18n:layers')

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
