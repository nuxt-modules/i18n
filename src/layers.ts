import createDebug from 'debug'
import { resolve } from 'pathe'
import { isArray } from '@intlify/shared'
import { NUXT_I18N_MODULE_ID } from './constants'
import { getProjectPath, mergeConfigLocales, resolveVueI18nConfigInfo } from './utils'

import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { LocaleObject } from 'vue-i18n-routing'
import type { NuxtI18nOptions } from './types'

const debug = createDebug('@nuxtjs/i18n:layers')

export const applyLayerOptions = (options: NuxtI18nOptions, nuxt: Nuxt) => {
  const project = nuxt.options._layers[0]
  const layers = nuxt.options._layers

  // No layers to merge
  if (layers.length === 1) return

  const resolvedLayerPaths = layers.map(l => resolve(project.config.rootDir, l.config.rootDir))
  debug('using layers at paths', resolvedLayerPaths)

  const mergedLocales = mergeLayerLocales(nuxt)
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

function getProjectLayerI18n(configLayer: NuxtConfigLayer) {
  if (configLayer.config.i18n) {
    return configLayer.config.i18n
  }

  for (const mod of configLayer.config.modules || []) {
    if (isArray(mod) && mod[0] === NUXT_I18N_MODULE_ID) {
      return mod[1] as NuxtI18nOptions
    }
  }
}

export const mergeLayerLocales = (nuxt: Nuxt) => {
  const projectLayer = nuxt.options._layers[0]
  const projectI18n = getProjectLayerI18n(projectLayer)

  if (projectI18n == null) {
    debug('project layer `i18n` configuration is required')
    return []
  }
  debug('project layer `lazy` option', projectI18n.lazy)

  /**
   * Merge locales when `lazy: false`
   */
  const mergeSimpleLocales = () => {
    if (projectI18n.locales == null) return []

    const firstI18nLayer = nuxt.options._layers.find(layer => {
      const i18n = getProjectLayerI18n(layer)
      return i18n?.locales && i18n?.locales?.length > 0
    })
    if (firstI18nLayer == null) return []

    const localeType = typeof getProjectLayerI18n(firstI18nLayer)?.locales?.at(0)
    const isStringLocales = (val: unknown): val is string[] => localeType === 'string'

    const mergedLocales: string[] | LocaleObject[] = []

    /*
      Layers need to be reversed to ensure that the original first layer (project)
      has the highest priority in merging (because in the reversed array it gets merged last)
    */
    const reversedLayers = [...nuxt.options._layers].reverse()
    for (const layer of reversedLayers) {
      const i18n = getProjectLayerI18n(layer)
      debug('layer.config.i18n.locales', i18n?.locales)
      if (i18n?.locales == null) continue

      for (const locale of i18n.locales) {
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
      .filter(layer => {
        const i18n = getProjectLayerI18n(layer)
        return i18n?.locales != null && i18n?.langDir != null
      })
      .map(layer => {
        const i18n = getProjectLayerI18n(layer)
        return {
          ...i18n,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          langDir: resolve(layer.config.rootDir, i18n!.langDir!),
          projectLangDir
        }
      })

    return mergeConfigLocales(configs)
  }

  return projectI18n.lazy ? mergeLazyLocales() : mergeSimpleLocales()
}

/**
 * Returns an array of absolute paths to each layers `langDir`
 */
export const getLayerLangPaths = (nuxt: Nuxt) => {
  return nuxt.options._layers
    .filter(layer => {
      const i18n = getProjectLayerI18n(layer)
      return i18n?.langDir != null
    })
    .map(layer => {
      const i18n = getProjectLayerI18n(layer)
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
      const i18n = getProjectLayerI18n(layer)
      return resolveVueI18nConfigInfo(i18n || {}, buildDir, layer.config.rootDir)
    })
  )
}
