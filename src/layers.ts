import type { Nuxt } from '@nuxt/schema'
import type { LocaleObject } from 'vue-i18n-routing'
import type { NuxtI18nOptions } from './types'
import createDebug from 'debug'
import pathe from 'pathe'
import { getProjectPath, mergeConfigLocales } from './utils'

const debug = createDebug('@nuxtjs/i18n:layers')

export const applyLayerOptions = (options: NuxtI18nOptions, nuxt: Nuxt) => {
  const project = nuxt.options._layers[0]
  const layers = nuxt.options._layers

  // No layers to merge
  if (layers.length === 1) return

  const resolvedLayerPaths = layers.map(l => pathe.resolve(project.config.rootDir, l.config.rootDir))
  debug('using layers at paths -', resolvedLayerPaths)

  const mergedLocales = mergeLayerLocales(nuxt)
  debug('merged locales - ', mergedLocales)

  options.locales = mergedLocales
}

export const mergeLayerPages = (analyzer: (pathOverride: string) => void, nuxt: Nuxt) => {
  const project = nuxt.options._layers[0]
  const layers = nuxt.options._layers

  // No layers to merge
  if (layers.length === 1) return

  for (const l of layers) {
    const lPath = pathe.resolve(project.config.rootDir, l.config.rootDir, l.config.dir?.pages ?? 'pages')
    analyzer(lPath)
  }
}

export const mergeLayerLocales = (nuxt: Nuxt) => {
  const projectLayer = nuxt.options._layers[0]
  const projectI18n = projectLayer.config.i18n

  if (projectI18n == null) {
    debug('project layer `i18n` configuration is required')
    return []
  }

  /**
   * Merge locales when `lazy: false`
   */
  const mergeSimpleLocales = () => {
    if (projectI18n.locales == null) return []

    const firstI18nLayer = nuxt.options._layers.find(x => x.config.i18n?.locales && x.config.i18n?.locales?.length > 0)
    if (firstI18nLayer == null) return []

    const localeType = typeof firstI18nLayer.config.i18n?.locales?.at(0)
    const isStringLocales = (val: unknown): val is string[] => localeType === 'string'

    const mergedLocales: string[] | LocaleObject[] = []
    for (const layer of nuxt.options._layers) {
      if (layer.config.i18n?.locales == null) continue

      for (const locale of layer.config.i18n.locales) {
        if (isStringLocales(mergedLocales)) {
          if (typeof locale !== 'string') continue
          if (mergedLocales.includes(locale)) continue

          mergedLocales.push(locale)
          continue
        }

        if (typeof locale === 'string') continue
        const localeEntry = mergedLocales.find(x => x.code === locale.code)

        if (localeEntry == null) {
          mergedLocales.push(locale)
        } else {
          Object.assign(localeEntry, locale, localeEntry)
        }
      }
    }

    return mergedLocales
  }

  const mergeLazyLocales = () => {
    if (projectI18n.langDir == null) {
      debug('project layer `i18n.langDir` is required')
      return []
    }

    const projectLangDir = getProjectPath(nuxt, projectI18n.langDir)
    debug('project path', getProjectPath(nuxt))

    const configs = nuxt.options._layers
      .filter(x => x.config.i18n?.locales != null && x.config.i18n?.langDir != null)
      .map(x => ({
        ...x.config.i18n,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        langDir: pathe.resolve(x.config.rootDir, x.config.i18n!.langDir!),
        projectLangDir
      }))

    return mergeConfigLocales(configs)
  }

  return projectI18n.lazy ? mergeLazyLocales() : mergeSimpleLocales()
}

/**
 * Returns an array of absolute paths to each layers `langDir`
 */
export const getLayerLangPaths = (nuxt: Nuxt) => {
  return (
    nuxt.options._layers
      .filter(layer => layer.config.i18n?.langDir != null)
      // @ts-ignore
      .map(layer => pathe.resolve(layer.config.rootDir, layer.config.i18n.langDir)) as string[]
  )
}
