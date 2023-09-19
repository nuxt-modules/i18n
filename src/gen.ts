/* eslint-disable @typescript-eslint/no-explicit-any */

import createDebug from 'debug'
import { EXECUTABLE_EXTENSIONS, NUXT_I18N_MODULE_ID } from './constants'
import { genImport, genDynamicImport } from 'knitwork'
import { withQuery } from 'ufo'
import { getLocalePaths, toCode } from './utils'

import type { NuxtI18nOptions, NuxtI18nInternalOptions, LocaleInfo, VueI18nConfigPathInfo, FileMeta } from './types'
import type { NuxtI18nOptionsDefault } from './constants'
import type { LocaleObject } from 'vue-i18n-routing'

export type LoaderOptions = {
  localeCodes?: string[]
  localeInfo?: LocaleInfo[]
  nuxtI18nOptions?: NuxtI18nOptions
  nuxtI18nOptionsDefault?: NuxtI18nOptionsDefault
  nuxtI18nInternalOptions?: NuxtI18nInternalOptions
}

type ResourceType = 'locale' | 'config'

const debug = createDebug('@nuxtjs/i18n:gen')

const generateVueI18nConfiguration = (config: Required<VueI18nConfigPathInfo>): string => {
  return genDynamicImport(genImportSpecifier(config.meta, 'config'), {
    comment: `webpackChunkName: ${config.meta.key}`
  })
}

function simplifyLocaleOptions(locales: LocaleObject[]) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return locales.map(({ meta, ...locale }) => {
    if (
      locale?.files == null ||
      (locale?.files?.length === 0 &&
        Object.keys(locale).filter(k => !['iso', 'code', 'hashes', 'types', 'file', 'files'].includes(k)).length === 0)
    ) {
      return locale.code
    }

    return { ...locale, files: getLocalePaths(locale) }
  })
}

export function generateLoaderOptions(
  lazy: NonNullable<NuxtI18nOptions['lazy']>,
  vueI18nConfigPaths: Required<VueI18nConfigPathInfo>[],
  options: LoaderOptions = {},
  misc: {
    dev: boolean
    ssg: boolean
    parallelPlugin: boolean
  } = { dev: true, ssg: false, parallelPlugin: false }
) {
  debug('generateLoaderOptions: lazy', lazy)

  const importMapper = new Map<string, string>()

  function generateLocaleImports(gen: string, locale: string, meta: NonNullable<LocaleInfo['meta']>[number]) {
    if (importMapper.has(meta.key)) return gen
    const importSpecifier = genImportSpecifier(meta, 'locale', { locale })
    const importer = { code: locale, key: meta.loadPath, load: '', cache: meta.file.cache ?? true }

    if (lazy) {
      importer.load = genDynamicImport(importSpecifier, { comment: `webpackChunkName: "${meta.key}"` })
    } else {
      const assertFormat = meta.parsed.ext.slice(1)
      const importOptions = assertFormat ? { assert: { type: assertFormat } } : {}
      gen += `${genImport(importSpecifier, meta.key, importOptions)}\n`

      importer.load = `() => Promise.resolve(${meta.key})`
    }

    importMapper.set(
      meta.key,
      `{ key: ${toCode(importer?.key)}, load: ${importer?.load}, cache: ${toCode(importer?.cache)} }`
    )

    return gen
  }

  let genCode = '// @ts-nocheck\n'
  const localeInfo = options.localeInfo || []

  /**
   * Prepare locale file imports
   */
  for (const locale of localeInfo) {
    locale?.meta?.forEach(meta => (genCode = generateLocaleImports(genCode, locale.code, meta)))
  }

  /**
   * Reverse order so project overwrites layers
   */
  const vueI18nConfigImports = vueI18nConfigPaths
    .reverse()
    .filter(config => config.absolute !== '')
    .map(config => generateVueI18nConfiguration(config))
    .filter((x): x is string => x != null)

  /**
   * Generate options
   */
  // prettier-ignore
  genCode += `${Object.entries(options).map(([rootKey, rootValue]) => {
    if (rootKey === 'nuxtI18nOptions') {
      let genCodes = `export const resolveNuxtI18nOptions = async (context) => {\n`
      genCodes += `  const ${rootKey} = Object({})\n`
      for (const [key, value] of Object.entries(rootValue)) {
        if (key === 'vueI18n') {
          genCodes += ` const vueI18nConfigLoader = async loader => {
            const config = await loader().then(r => r.default || r)
            if (typeof config === 'object') return config
            if (typeof config === 'function') return await config()
            return {}
          }
          const deepCopy = (src, des, predicate) => {
            for (const key in src) {
              if (typeof src[key] === 'object') {
                if (!(typeof des[key] === 'object')) des[key] = {}
                deepCopy(src[key], des[key], predicate)
              } else {
                if (predicate) {
                  if (predicate(src[key], des[key])) {
                    des[key] = src[key]
                  }
                } else {
                  des[key] = src[key]
                }
              }
            }
          }

          const mergeVueI18nConfigs = async (configuredMessages, loader) => {
            const layerConfig = await vueI18nConfigLoader(loader)
            const cfg = layerConfig || {}
            cfg.messages ??= {}
            const skipped = ['messages']

            for (const [k, v] of Object.entries(cfg).filter(([k]) => !skipped.includes(k))) {
              if(nuxtI18nOptions.vueI18n?.[k] === undefined || typeof nuxtI18nOptions.vueI18n?.[k] !== 'object') {
                nuxtI18nOptions.vueI18n[k] = v
              } else {
                deepCopy(v, nuxtI18nOptions.vueI18n[k])
              }
            }

            for (const [locale, message] of Object.entries(cfg.messages)) {
              configuredMessages[locale] ??= {}
              deepCopy(message, configuredMessages[locale])
            }
          }
`
          genCodes += `  ${rootKey}.${key} = ${toCode({ messages: {} })}\n`
          
          for (const importStatement of vueI18nConfigImports) {
            genCodes += `  await mergeVueI18nConfigs(${rootKey}.${key}.messages, (${importStatement}))\n`
          }
        } else {
          genCodes += `  ${rootKey}.${key} = ${toCode(
            key === 'locales' ? simplifyLocaleOptions(value as unknown as LocaleObject[]) : value
          )}\n`
        }
      }
      genCodes += `  return nuxtI18nOptions\n`
      genCodes += `}\n`
      return genCodes
    } else if (rootKey === 'nuxtI18nOptionsDefault') {
      return `export const ${rootKey} = Object({${Object.entries(rootValue).map(([key, value]) => `${key}: ${toCode(value)}`).join(`,`)}})\n`
    } else if (rootKey === 'nuxtI18nInternalOptions') {
      return `export const ${rootKey} = Object({${Object.entries(rootValue).map(([key, value]) => `${key}: ${toCode(value)}`).join(`,`)}})\n`
    } else if (rootKey === 'localeInfo') {
      return `export const localeMessages = {\n${localeInfo.map(locale => `  ${toCode(locale.code)}: [${locale.meta?.map(meta => importMapper.get(meta.key))}]`).join(',\n')}\n}\n`
    } else {
      return `export const ${rootKey} = ${toCode(rootValue)}\n`
    }
  }).join('\n')}`

  /**
   * Generate meta info
   */
  genCode += `export const NUXT_I18N_MODULE_ID = ${toCode(NUXT_I18N_MODULE_ID)}\n`
  genCode += `export const isSSG = ${toCode(misc.ssg)}\n`
  genCode += `export const parallelPlugin = ${toCode(misc.parallelPlugin)}\n`

  debug('generate code', genCode)
  return genCode
}

function genImportSpecifier(
  { loadPath, path, parsed, hash, type }: Pick<FileMeta, 'loadPath' | 'path' | 'parsed' | 'hash' | 'type'>,
  resourceType: ResourceType | undefined,
  query: Record<string, string> = {}
) {
  if (!EXECUTABLE_EXTENSIONS.includes(parsed.ext)) return loadPath

  if (resourceType != null && type === 'unknown') {
    throw new Error(`'unknown' type in '${path}'.`)
  }

  if (resourceType === 'locale') {
    return withQuery(loadPath, type === 'dynamic' ? { hash, ...query } : {})
  }

  if (resourceType === 'config') {
    return withQuery(loadPath, { hash, ...query, ...{ config: 1 } })
  }

  return loadPath
}

/* eslint-enable @typescript-eslint/no-explicit-any */
