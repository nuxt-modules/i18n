import createDebug from 'debug'
import { EXECUTABLE_EXTENSIONS } from './constants'
import { genImport, genDynamicImport } from 'knitwork'
import { withQuery } from 'ufo'
import { resolve, relative, join } from 'pathe'
import { distDir, runtimeDir } from './dirs'
import { getLayerI18n, getLocalePaths, getNormalizedLocales, toCode } from './utils'

import type { Nuxt } from '@nuxt/schema'
import type { PrerenderTarget } from './utils'
import type { NuxtI18nOptions, LocaleInfo, VueI18nConfigPathInfo, FileMeta, LocaleObject } from './types'
import type { Locale } from 'vue-i18n'

export type LoaderOptions = {
  vueI18nConfigPaths: Required<VueI18nConfigPathInfo>[]
  localeInfo: LocaleInfo[]
  nuxtI18nOptions: NuxtI18nOptions
  isServer: boolean
}

const debug = createDebug('@nuxtjs/i18n:gen')

const generateVueI18nConfiguration = (config: Required<VueI18nConfigPathInfo>, isServer = false): string => {
  return genDynamicImport(
    genImportSpecifier({ ...config.meta, isServer }, 'config'),
    !isServer
      ? {
          comment: `webpackChunkName: "${config.meta.key}"`
        }
      : {}
  )
}

export function simplifyLocaleOptions(nuxt: Nuxt, options: NuxtI18nOptions) {
  const isLocaleObjectsArray = (locales?: Locale[] | LocaleObject[]) => locales?.some(x => typeof x !== 'string')

  const hasLocaleObjects =
    nuxt.options._layers.some(layer => isLocaleObjectsArray(getLayerI18n(layer)?.locales)) ||
    options?.i18nModules?.some(module => isLocaleObjectsArray(module?.locales))

  const locales = (options.locales ?? []) as LocaleObject[]

  return locales.map(({ meta, ...locale }) => {
    if (!hasLocaleObjects) {
      return locale.code
    }

    // TODO: remove in v9 release
    if (locale.iso) {
      console.warn(
        `Locale ${locale.iso} uses deprecated \`iso\` property, this will be replaced with \`language\` in v9`
      )
      locale.language = locale.iso
    }

    if (locale.file || (locale.files?.length ?? 0) > 0) {
      locale.files = getLocalePaths(locale)
    } else {
      delete locale.files
    }
    delete locale.file

    return locale
  })
}

export function generateLoaderOptions(
  nuxt: Nuxt,
  { nuxtI18nOptions, vueI18nConfigPaths, localeInfo, isServer }: LoaderOptions
) {
  debug('generateLoaderOptions: lazy', nuxtI18nOptions.lazy)

  const importMapper = new Map<string, { key: string; load: string; cache: string }>()
  const importStrings: string[] = []

  function generateLocaleImports(locale: Locale, meta: NonNullable<LocaleInfo['meta']>[number], isServer = false) {
    if (importMapper.has(meta.key)) return
    const importSpecifier = genImportSpecifier({ ...meta, isServer }, 'locale', { locale })
    const importer = { code: locale, key: meta.loadPath, load: '', cache: meta.file.cache ?? true }

    if (nuxtI18nOptions.lazy) {
      importer.load = genDynamicImport(importSpecifier, !isServer ? { comment: `webpackChunkName: "${meta.key}"` } : {})
    } else {
      importStrings.push(genImport(importSpecifier, meta.key))
      importer.load = `() => Promise.resolve(${meta.key})`
    }

    importMapper.set(meta.key, {
      key: toCode(importer?.key),
      load: importer?.load,
      cache: toCode(importer?.cache)
    })
  }

  /**
   * Prepare locale file imports
   */
  for (const locale of localeInfo) {
    locale?.meta?.forEach(meta => generateLocaleImports(locale.code, meta, isServer))
  }

  /**
   * Prepare Vue I18n config imports
   */
  const vueI18nConfigImports = [...vueI18nConfigPaths]
    .reverse()
    .filter(config => config.absolute !== '')
    .map(config => generateVueI18nConfiguration(config, isServer))

  const localeLoaders = localeInfo.map(locale => [locale.code, locale.meta?.map(meta => importMapper.get(meta.key))])

  const generatedNuxtI18nOptions = {
    ...nuxtI18nOptions,
    locales: simplifyLocaleOptions(nuxt, nuxtI18nOptions)
  }
  delete nuxtI18nOptions.vueI18n

  const generated = {
    importStrings,
    localeLoaders,
    nuxtI18nOptions: generatedNuxtI18nOptions,
    vueI18nConfigs: vueI18nConfigImports
  }

  debug('generate code', generated)

  return generated
}

function genImportSpecifier(
  {
    loadPath,
    path,
    parsed,
    hash,
    type,
    isServer
  }: Pick<FileMeta, 'loadPath' | 'path' | 'parsed' | 'hash' | 'type'> & { isServer?: boolean },
  resourceType: PrerenderTarget['type'] | undefined,
  query: Record<string, string> = {}
) {
  const getLoadPath = () => (!isServer ? loadPath : path)

  if (!EXECUTABLE_EXTENSIONS.includes(parsed.ext)) {
    return getLoadPath()
  }

  if (resourceType != null && type === 'unknown') {
    throw new Error(`'unknown' type in '${path}'.`)
  }

  if (resourceType === 'locale') {
    return !isServer ? withQuery(getLoadPath(), type === 'dynamic' ? { hash, ...query } : {}) : getLoadPath()
  }

  if (resourceType === 'config') {
    return !isServer ? withQuery(getLoadPath(), { hash, ...query, ...{ config: 1 } }) : getLoadPath()
  }

  return getLoadPath()
}

export function generateI18nPageTypes() {
  return `// Generated by @nuxtjs/i18n
declare module 'nuxt/dist/pages/runtime' {
  interface PageMeta {
    nuxtI18n?: Record<string, any>
  }
}

export {}`
}

export function generateI18nTypes(nuxt: Nuxt, options: NuxtI18nOptions) {
  const vueI18nTypes = options.types === 'legacy' ? ['VueI18n'] : ['ExportedGlobalComposer', 'Composer']
  const generatedLocales = simplifyLocaleOptions(nuxt, options)
  const resolvedLocaleType = typeof generatedLocales === 'string' ? 'Locale[]' : 'LocaleObject[]'
  const localeCodeStrings = getNormalizedLocales(options.locales).map(x => x.code)

  const i18nType = `${vueI18nTypes.join(' & ')} & NuxtI18nRoutingCustomProperties<${resolvedLocaleType}>`

  const globalTranslationTypes = `
declare global {
  var $t: (${i18nType})['t']
  var $rt: (${i18nType})['rt']
  var $n: (${i18nType})['n']
  var $d: (${i18nType})['d']
  var $tm: (${i18nType})['tm']
  var $te: (${i18nType})['te']
}`

  // prettier-ignore
  return `// Generated by @nuxtjs/i18n
import type { ${vueI18nTypes.join(', ')} } from 'vue-i18n'
import type { NuxtI18nRoutingCustomProperties, ComposerCustomProperties } from '${relative(
    join(nuxt.options.buildDir, 'types'),
    resolve(runtimeDir, 'types.ts')
  )}'
import type { Strategies, Directions, LocaleObject } from '${relative(
    join(nuxt.options.buildDir, 'types'),
    resolve(distDir, 'types.d.ts')
  )}'

declare module 'vue-i18n' {
  interface ComposerCustom extends ComposerCustomProperties<${resolvedLocaleType}> {}
  interface ExportedGlobalComposer extends NuxtI18nRoutingCustomProperties<${resolvedLocaleType}> {}
  interface VueI18n extends NuxtI18nRoutingCustomProperties<${resolvedLocaleType}> {}
}

declare module '@intlify/core-base' {
  // generated based on configured locales
  interface GeneratedTypeConfig { 
    locale: ${localeCodeStrings.map(x => JSON.stringify(x)).join(' | ')}
  }
}


declare module '#app' {
  interface NuxtApp {
    $i18n: ${i18nType}
  }
}

${(options.experimental?.autoImportTranslationFunctions && globalTranslationTypes) || ''}

export {}`
}
