/* eslint-disable @typescript-eslint/no-explicit-any */

import createDebug from 'debug'
import { isArray, isObject } from '@intlify/shared'
import { EXECUTABLE_EXTENSIONS, NULL_HASH, NUXT_I18N_MODULE_ID } from './constants'
import { genImport, genSafeVariableName, genDynamicImport } from 'knitwork'
import { parse as parsePath, normalize } from 'pathe'
import { withQuery } from 'ufo'
import { getLocalePaths, toCode } from './utils'

import type { NuxtI18nOptions, NuxtI18nInternalOptions, LocaleInfo, VueI18nConfigPathInfo, LocaleType } from './types'
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

export function generateLoaderOptions(
  lazy: NonNullable<NuxtI18nOptions['lazy']>,
  localesRelativeBase: string,
  vueI18nConfigPathInfo: VueI18nConfigPathInfo,
  vueI18nConfigPaths: VueI18nConfigPathInfo[],
  options: LoaderOptions = {},
  misc: {
    dev: boolean
    ssg: boolean
    parallelPlugin: boolean
  } = { dev: true, ssg: false, parallelPlugin: false }
) {
  debug('generateLoaderOptions: lazy', lazy)
  debug('generateLoaderOptions: localesRelativeBase', localesRelativeBase)
  debug('generateLoaderOptions: vueI18nConfigPathInfo', vueI18nConfigPathInfo)

  const generatedImports = new Map<string, string>()
  const importMapper = new Map<string, string>()

  const convertToPairs = ({ files, path, paths, hash, hashes, type, types }: LocaleInfo) => {
    const _paths = path ? [path] : paths || []
    const _hashes = hash ? [hash] : hashes || []
    const _types = type ? [type] : types || []
    return (files ?? []).map((f, i) => ({ file: f, path: _paths[i], hash: _hashes[i], type: _types[i] }))
  }

  const makeImportKey = (root: string, dir: string, base: string) =>
    normalize(`${root ? `${root}/` : ''}${dir ? `${dir}/` : ''}${base}`)

  function generateSyncImports(
    gen: string,
    absolutePath: string,
    type: LocaleType,
    localeCode: string,
    hash: string,
    relativePath?: string
  ) {
    if (!relativePath) {
      return gen
    }

    const { root, dir, base, ext } = parsePath(relativePath)
    const key = makeImportKey(root, dir, base)
    if (!generatedImports.has(key)) {
      const loadPath = resolveLocaleRelativePath(localesRelativeBase, relativePath)
      const assertFormat = ext.slice(1)
      const variableName = genSafeVariableName(`locale_${convertToImportId(key)}`)
      gen += `${genImport(
        genImportSpecifier(loadPath, ext, absolutePath, type, {
          hash,
          resourceType: 'locale',
          query: { locale: localeCode }
        }),
        variableName,
        assertFormat ? { assert: { type: assertFormat } } : {}
      )}\n`
      importMapper.set(key, variableName)
      generatedImports.set(key, loadPath)
    }

    return gen
  }

  function simplifyLocaleOptions(locales: LocaleObject[]) {
    return locales.map(locale => {
      if (
        locale?.files?.length === 0 &&
        Object.keys(locale).filter(k => !['iso', 'code', 'hashes', 'types', 'file', 'files'].includes(k)).length === 0
      ) {
        return locale.code
      }

      return { ...locale, files: getLocalePaths(locale) }
    })
  }

  let genCode = ''
  const localeInfo = options.localeInfo || []
  const syncLocaleFiles = new Set<LocaleInfo>()
  const asyncLocaleFiles = new Set<LocaleInfo>()

  /**
   * Prepare locale files for synchronous or asynchronous
   */
  for (const locale of localeInfo) {
    if (!syncLocaleFiles.has(locale) && !asyncLocaleFiles.has(locale)) {
      ;(lazy ? asyncLocaleFiles : syncLocaleFiles).add(locale)
    }
  }

  /**
   * Generate locale synchronous imports
   */
  for (const localeInfo of syncLocaleFiles) {
    convertToPairs(localeInfo).forEach(({ path, type, file, hash }) => {
      genCode = generateSyncImports(genCode, path, type, localeInfo.code, hash, file.path)
    })
  }

  /**
   * Strip info for code generation
   */
  const stripPathFromLocales = (locales: any) => {
    if (isArray(locales)) {
      return locales.map(locale => {
        if (isObject(locale)) {
          const obj = { ...locale }
          delete obj.path
          delete obj.paths
          return obj
        } else {
          return locale
        }
      })
    } else {
      return locales
    }
  }

  const generateVueI18nConfiguration = (
    configPath: VueI18nConfigPathInfo,
    fn: (configPath: Required<VueI18nConfigPathInfo>, meta: { dir: string; base: string; ext: string }) => string | null
  ) => {
    const { absolute: absolutePath, relative: relativePath, hash } = configPath
    if (absolutePath != null && relativePath != null && hash != null) {
      const { ext } = parsePath(absolutePath)
      const { dir, base: _base, ext: relativeExt } = parsePath(relativePath)
      const base = relativeExt === '.config' ? `${_base}${ext}` : _base
      return fn(configPath as Required<VueI18nConfigPathInfo>, { dir, base, ext })
    } else {
      return null
    }
  }

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
`
          genCodes += `  ${rootKey}.${key} = ${toCode({ messages: {} })}\n`

          const combinedConfigs = [vueI18nConfigPathInfo, ...vueI18nConfigPaths].reverse()
          genCodes += `  const deepCopy = (src, des, predicate) => {
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
          
          for (const configPath of combinedConfigs) {
            const additionalVueI18nConfigCode = generateVueI18nConfiguration(
              configPath,
              ({ absolute: absolutePath, relative: relativePath, hash, relativeBase, type }, { dir, base, ext }) => {
                const configImportKey = makeImportKey(relativeBase, dir, base)
                return `await mergeVueI18nConfigs(${rootKey}.${key}.messages, (${genDynamicImport(
                  genImportSpecifier(configImportKey, ext, absolutePath, type, { hash, resourceType: 'config' }),
                  { comment: `webpackChunkName: "${normalizeWithUnderScore(relativePath)}_${hash}"` }
                )}))\n`
              }
            )
            if (additionalVueI18nConfigCode != null) {
              genCodes += `  ${additionalVueI18nConfigCode}`
            }
          }
        } else {
          genCodes += `  ${rootKey}.${key} = ${toCode(
            key === 'locales' ? simplifyLocaleOptions(stripPathFromLocales(value)) : value
          )}\n`
        }
      }
      genCodes += `  return nuxtI18nOptions\n`
      genCodes += `}\n`
      return genCodes
    } else if (rootKey === 'nuxtI18nOptionsDefault') {
      // generate default nuxtI18n options
      return `export const ${rootKey} = Object({${Object.entries(rootValue).map(([key, value]) => {
        return `${key}: ${toCode(value)}`
      }).join(`,`)}})\n`
    } else if (rootKey === 'nuxtI18nInternalOptions') {
      return `export const ${rootKey} = Object({${Object.entries(rootValue).map(([key, value]) => {
        return `${key}: ${toCode(key === '__normalizedLocales' ? stripPathFromLocales(value) : value)}`
      }).join(`,`)}})\n`
    } else if (rootKey === 'localeInfo') {
      let codes = `export const localeMessages = {\n`
        for (const { code, files} of syncLocaleFiles) {
          codes += `  ${toCode(code)}: [${(files ?? []).map(file => {
            const { root, dir, base } = parsePath(file.path)
            const key = makeImportKey(root, dir, base)
            return `{ key: ${toCode(generatedImports.get(key))}, load: () => Promise.resolve(${importMapper.get(key)}), cache: ${toCode(file.cache)} }`
          })}],\n`
        }
        for (const localeInfo of asyncLocaleFiles) {
          codes += `  ${toCode(localeInfo.code)}: [${convertToPairs(localeInfo).map(({ file, path, hash, type }) => {
            const { root, dir, base, ext } = parsePath(file.path)
            const key = makeImportKey(root, dir, base)
            const loadPath = resolveLocaleRelativePath(localesRelativeBase, file.path)
            return `{ key: ${toCode(loadPath)}, load: ${genDynamicImport(
              genImportSpecifier(loadPath, ext, path, type, { hash, query: { locale: localeInfo.code } }),
              { comment: `webpackChunkName: "lang_${normalizeWithUnderScore(key)}"` })}, cache: ${toCode(file.cache)} }`
          })}],\n`
        }
      codes += `}\n`
      return codes
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

function raiseSyntaxError(path: string) {
  throw new Error(`'unknown' type in '${path}'.`)
}

function genImportSpecifier(
  id: string,
  ext: string,
  absolutePath: string,
  type: LocaleType,
  {
    hash = NULL_HASH,
    resourceType = 'locale',
    query = {}
  }: {
    hash?: string
    resourceType?: ResourceType
    query?: Record<string, string>
  } = {}
) {
  if (EXECUTABLE_EXTENSIONS.includes(ext)) {
    if (resourceType === 'locale') {
      type === 'unknown' && raiseSyntaxError(absolutePath)
      return type === 'dynamic' ? withQuery(id, { hash, ...query }) : id
    } else if (resourceType === 'config') {
      type === 'unknown' && raiseSyntaxError(absolutePath)
      return withQuery(id, { hash, ...query, ...{ config: 1 } })
    } else {
      return id
    }
  } else {
    return id
  }
}

const IMPORT_ID_CACHES = new Map<string, string>()

const normalizeWithUnderScore = (name: string) => name.replace(/-/g, '_').replace(/\./g, '_').replace(/\//g, '_')

function convertToImportId(file: string) {
  if (IMPORT_ID_CACHES.has(file)) {
    return IMPORT_ID_CACHES.get(file)
  }

  const { name, dir } = parsePath(file)
  const id = normalizeWithUnderScore(`${dir}/${name}`)
  IMPORT_ID_CACHES.set(file, id)

  return id
}

function resolveLocaleRelativePath(relativeBase: string, file: string) {
  return normalize(`${relativeBase}/${file}`)
}

/* eslint-enable @typescript-eslint/no-explicit-any */
