/* eslint-disable @typescript-eslint/no-explicit-any */

import createDebug from 'debug'
import { isArray, isObject } from '@intlify/shared'
import { EXECUTABLE_EXTENSIONS, NULL_HASH, NUXT_I18N_MODULE_ID } from './constants'
import { genImport, genSafeVariableName, genDynamicImport } from 'knitwork'
import { parse as parsePath, normalize } from 'pathe'
import { withQuery } from 'ufo'
import { toCode } from './utils'

import type { NuxtI18nOptions, NuxtI18nInternalOptions, LocaleInfo, VueI18nConfigPathInfo, LocaleType } from './types'
import type { NuxtI18nOptionsDefault } from './constants'

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
  langDir: NuxtI18nOptions['langDir'],
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

  const convertToPairs = ({ file, files, path, paths, hash, hashes, type, types }: LocaleInfo) => {
    const _files = file ? [file] : files || []
    const _paths = path ? [path] : paths || []
    const _hashes = hash ? [hash] : hashes || []
    const _types = type ? [type] : types || []
    return _files.map((f, i) => ({ file: f, path: _paths[i], hash: _hashes[i], type: _types[i] }))
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
      let loadPath = relativePath
      if (langDir) {
        loadPath = resolveLocaleRelativePath(localesRelativeBase, langDir, relativePath)
      }
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

  let genCode = ''
  const localeInfo = options.localeInfo || []
  const syncLocaleFiles = new Set<LocaleInfo>()
  const asyncLocaleFiles = new Set<LocaleInfo>()

  /**
   * Prepare locale files for synthetic or asynthetic
   */
  if (langDir) {
    for (const locale of localeInfo) {
      if (!syncLocaleFiles.has(locale) && !asyncLocaleFiles.has(locale)) {
        ;(lazy ? asyncLocaleFiles : syncLocaleFiles).add(locale)
      }
    }
  }

  /**
   * Generate locale synthetic imports
   */
  for (const localeInfo of syncLocaleFiles) {
    convertToPairs(localeInfo).forEach(({ path, type, file, hash }) => {
      genCode = generateSyncImports(genCode, path, type, localeInfo.code, hash, file)
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

  const generateVueI18nConfigration = (
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
          genCodes += ` const vueI18nConfigLoader = async (loader) => {
            const config = await loader().then(r => r.default || r)
            return typeof config === 'object'
              ? config
              : typeof config === 'function'
                ? await config()
                : {}
          }
`
          const basicVueI18nConfigCode = generateVueI18nConfigration(vueI18nConfigPathInfo, ({ absolute: absolutePath, relative: relativePath, hash, relativeBase, type }, { dir, base, ext }) => {
            const configImportKey = makeImportKey(relativeBase, dir, base)
            return `const vueI18n = await vueI18nConfigLoader((${genDynamicImport(genImportSpecifier(configImportKey, ext, absolutePath, type, { hash, resourceType: 'config' }), { comment: `webpackChunkName: "${normalizeWithUnderScore(relativePath)}_${hash}"` })}))\n`
          })
          if (basicVueI18nConfigCode != null) {
            genCodes += `  ${basicVueI18nConfigCode}`
            genCodes += `  ${rootKey}.${key} = vueI18n\n`
          } else {
            genCodes += `  ${rootKey}.${key} = ${toCode({})}\n`
          }
          genCodes += `  ${rootKey}.${key}.messages ??= {}\n`

          if (vueI18nConfigPaths.length > 0) {
            genCodes += `  const deepCopy = (src, des, predicate) => {
            for (const key in src) {
              if (typeof src[key] === 'object') {
                if (!typeof des[key] === 'object') des[key] = {}
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
          const mergeMessages = async (messages, loader) => {
            const layerConfig = await vueI18nConfigLoader(loader)
            const vueI18n = layerConfig || {}
            const layerMessages = vueI18n.messages || {}
            for (const [locale, message] of Object.entries(layerMessages)) {
              messages[locale] ??= {}
              deepCopy(message, messages[locale])
            }
          }
`
          }
          for (const configPath of vueI18nConfigPaths) {
            const additionalVueI18nConfigCode = generateVueI18nConfigration(configPath, ({ absolute: absolutePath, relative: relativePath, hash, relativeBase, type }, { dir, base, ext }) => {
              const configImportKey = makeImportKey(relativeBase, dir, base)
              return `await mergeMessages(${rootKey}.${key}.messages, (${genDynamicImport(genImportSpecifier(configImportKey, ext, absolutePath, type, { hash, resourceType: 'config' }), { comment: `webpackChunkName: "${normalizeWithUnderScore(relativePath)}_${hash}"` })}))\n`
            })
            if (additionalVueI18nConfigCode != null) {
              genCodes += `  ${additionalVueI18nConfigCode}`
            }
          }
        } else {
          genCodes += `  ${rootKey}.${key} = ${toCode(key === 'locales' ? stripPathFromLocales(value) : value)}\n`
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
      if (langDir) {
        for (const { code, file, files } of syncLocaleFiles) {
          const syncPaths = file ? [file] : files || []
          codes += `  ${toCode(code)}: [${syncPaths.map(filepath => {
            const { root, dir, base } = parsePath(filepath)
            const key = makeImportKey(root, dir, base)
            return `{ key: ${toCode(generatedImports.get(key))}, load: () => Promise.resolve(${importMapper.get(key)}) }`
          })}],\n`
        }
        for (const localeInfo of asyncLocaleFiles) {
          codes += `  ${toCode(localeInfo.code)}: [${convertToPairs(localeInfo).map(({ file, path, hash, type }) => {
            const { root, dir, base, ext } = parsePath(file)
            const key = makeImportKey(root, dir, base)
            const loadPath = resolveLocaleRelativePath(localesRelativeBase, langDir, file)
            return `{ key: ${toCode(loadPath)}, load: ${genDynamicImport(genImportSpecifier(loadPath, ext, path, type, { hash, query: { locale: localeInfo.code } }), { comment: `webpackChunkName: "lang_${normalizeWithUnderScore(key)}"` })} }`
          })}],\n`
        }
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

  const { name } = parsePath(file)
  const id = normalizeWithUnderScore(name)
  IMPORT_ID_CACHES.set(file, id)

  return id
}

function resolveLocaleRelativePath(relativeBase: string, langDir: string, file: string) {
  return normalize(`${relativeBase}/${langDir}/${file}`)
}

/* eslint-enable @typescript-eslint/no-explicit-any */
