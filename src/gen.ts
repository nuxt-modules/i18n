/* eslint-disable @typescript-eslint/no-explicit-any */

import createDebug from 'debug'
import { isString, isRegExp, isFunction, isArray, isObject } from '@intlify/shared'
import { generateJSON } from '@intlify/bundle-utils'
import {
  JS_EXTENSIONS,
  TS_EXTENSIONS,
  NUXT_I18N_MODULE_ID,
  NUXT_I18N_CONFIG_PROXY_ID,
  NUXT_I18N_RESOURCE_PROXY_ID,
  NUXT_I18N_PRECOMPILE_ENDPOINT,
  NUXT_I18N_PRECOMPILED_LOCALE_KEY,
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
  NUXT_I18N_COMPOSABLE_DEFINE_CONFIG
} from './constants'
import { genImport, genSafeVariableName, genDynamicImport } from 'knitwork'
import { parse as parsePath, normalize } from 'pathe'
// @ts-ignore
import { transform as stripType } from '@mizchi/sucrase'
import { parse as _parseCode } from '@babel/parser'
import { asVirtualId } from './transform/utils'
import { getHash, readFileSync } from './utils'

import type { NuxtI18nOptions, NuxtI18nInternalOptions, LocaleInfo, VueI18nConfigPathInfo } from './types'
import type { NuxtI18nOptionsDefault } from './constants'
import type { AdditionalMessages } from './messages' // TODO: remove `i18n:extend-messages` before v8 official release
import type { File } from '@babel/types'

export type LoaderOptions = {
  localeCodes?: string[]
  localeInfo?: LocaleInfo[]
  nuxtI18nOptions?: NuxtI18nOptions
  nuxtI18nOptionsDefault?: NuxtI18nOptionsDefault
  nuxtI18nInternalOptions?: NuxtI18nInternalOptions
  additionalMessages?: AdditionalMessages // TODO: remove `i18n:extend-messages` before v8 official release
}

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
    ssr: boolean
  } = { dev: true, ssg: false, ssr: true }
) {
  debug('generateLoaderOptions: lazy', lazy)
  debug('generateLoaderOptions: localesRelativeBase', localesRelativeBase)
  debug('generateLoaderOptions: vueI18nConfigPathInfo', vueI18nConfigPathInfo)

  const generatedImports = new Map<string, string>()
  const importMapper = new Map<string, string>()

  const convertToPairs = ({ file, files, path, paths }: LocaleInfo) => {
    const _files = file ? [file] : files || []
    const _paths = path ? [path] : paths || []
    return _files.map((f, i) => ({ file: f, path: _paths[i] }))
  }

  const makImportKey = (root: string, dir: string, base: string) =>
    normalize(`${root ? `${root}/` : ''}${dir ? `${dir}/` : ''}${base}`)

  function generateSyncImports(gen: string, absolutePath: string, relativePath?: string) {
    if (!relativePath) {
      return gen
    }

    const { root, dir, base, ext } = parsePath(relativePath)
    const key = makImportKey(root, dir, base)
    if (!generatedImports.has(key)) {
      let loadPath = relativePath
      if (langDir) {
        loadPath = resolveLocaleRelativePath(localesRelativeBase, langDir, relativePath)
      }
      const assertFormat = ext.slice(1)
      const variableName = genSafeVariableName(`locale_${convertToImportId(key)}`)
      gen += `${genImport(
        genImportSpecifier(loadPath, ext, absolutePath),
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
    convertToPairs(localeInfo).forEach(({ file, path }) => {
      genCode = generateSyncImports(genCode, path, file)
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
    const { absolute: absolutePath, relative: relativePath } = configPath
    if (absolutePath != null && relativePath != null) {
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
          genCodes += ` const vueI18nConfigLoader = async (context, loader) => {
            const config = await loader().then(r => r.default || r)
            return typeof config === 'object'
              ? config
              : typeof config === 'function'
                ? await config(context)
                : {}
          }
`
          const basicVueI18nConfigCode = generateVueI18nConfigration(vueI18nConfigPathInfo, ({ absolute: absolutePath, relative: relativePath, relativeBase }, { dir, base, ext }) => {
            const configImportKey = makImportKey(relativeBase, dir, base)
            return `const vueI18n = await vueI18nConfigLoader(context, (${genDynamicImport(genImportSpecifier(configImportKey, ext, absolutePath, NUXT_I18N_CONFIG_PROXY_ID, NUXT_I18N_COMPOSABLE_DEFINE_CONFIG), { comment: `webpackChunkName: "${normalizeWithUnderScore(relativePath)}_${getHash(absolutePath)}"` })}))\n`
          })
          if (basicVueI18nConfigCode != null) {
            genCodes += `  ${basicVueI18nConfigCode}`
            genCodes += `  ${rootKey}.${key} = vueI18n\n`
          } else {
            genCodes += `  ${rootKey}.${key} = ${toCode({})}\n`
          }

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
          const mergeMessages = async (messages, context, loader) => {
            const layerConfig = await vueI18nConfigLoader(context, loader)
            const vueI18n = layerConfig.vueI18n || {}
            const layerMessages = vueI18n.messages || {}
            for (const [locale, message] of Object.entries(layerMessages)) {
              deepCopy(message, messages[locale])
            }
          }
`
          }
          for (const configPath of vueI18nConfigPaths) {
            const additionalVueI18nConfigCode = generateVueI18nConfigration(configPath, ({ absolute: absolutePath, relative: relativePath, relativeBase }, { dir, base, ext }) => {
              const configImportKey = makImportKey(relativeBase, dir, base)
              return `await mergeMessages(${rootKey}.${key}.messasges, context, (${genDynamicImport(genImportSpecifier(configImportKey, ext, absolutePath, NUXT_I18N_CONFIG_PROXY_ID, NUXT_I18N_COMPOSABLE_DEFINE_CONFIG), { comment: `webpackChunkName: "${normalizeWithUnderScore(relativePath)}_${getHash(absolutePath)}"` })}))\n`
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
        for (const { code, file, files} of syncLocaleFiles) {
          const syncPaths = file ? [file] : files|| []
          codes += `  ${toCode(code)}: [${syncPaths.map(filepath => {
            const { root, dir, base } = parsePath(filepath)
            const key = makImportKey(root, dir, base)
            return `{ key: ${toCode(generatedImports.get(key))}, load: () => Promise.resolve(${importMapper.get(key)}) }`
          })}],\n`
        }
        for (const localeInfo of asyncLocaleFiles) {
          codes += `  ${toCode(localeInfo.code)}: [${convertToPairs(localeInfo).map(({ file, path }) => {
            const { root, dir, base, ext } = parsePath(file)
            const key = makImportKey(root, dir, base)
            const loadPath = resolveLocaleRelativePath(localesRelativeBase, langDir, file)
            return `{ key: ${toCode(loadPath)}, load: ${genDynamicImport(genImportSpecifier(loadPath, ext, path), { comment: `webpackChunkName: "lang_${normalizeWithUnderScore(key)}"` })} }`
          })}],\n`
        }
      }
      codes += `}\n`
      return codes
    } else if (rootKey === 'additionalMessages') {
      // TODO: remove `i18n:extend-messages` before v8 official release
      return `export const ${rootKey} = ${generateAdditionalMessages(rootValue, misc.dev)}\n`
	  } else {
	    return `export const ${rootKey} = ${toCode(rootValue)}\n`
	  }
  }).join('\n')}`

  /**
   * Generate meta info
   */
  genCode += `export const NUXT_I18N_MODULE_ID = ${toCode(NUXT_I18N_MODULE_ID)}\n`
  genCode += `export const NUXT_I18N_PRECOMPILE_ENDPOINT = ${toCode(NUXT_I18N_PRECOMPILE_ENDPOINT)}\n`
  genCode += `export const NUXT_I18N_PRECOMPILED_LOCALE_KEY = ${toCode(NUXT_I18N_PRECOMPILED_LOCALE_KEY)}\n`
  genCode += `export const isSSG = ${toCode(misc.ssg)}\n`
  genCode += `export const isSSR = ${toCode(misc.ssr)}\n`

  debug('generate code', genCode)
  return genCode
}

type TransformProxyType = typeof NUXT_I18N_RESOURCE_PROXY_ID | typeof NUXT_I18N_CONFIG_PROXY_ID
type ComposableDefines = typeof NUXT_I18N_COMPOSABLE_DEFINE_LOCALE | typeof NUXT_I18N_COMPOSABLE_DEFINE_CONFIG

function raiseSyntaxError(path: string) {
  throw new Error(
    `Unexpected syntax detected in '${path}'. Please define the plain object or function, and it export at 'export default’ directly.`
  )
}

function genImportSpecifier(
  id: string,
  ext: string,
  absolutePath: string,
  virtualId: TransformProxyType = NUXT_I18N_RESOURCE_PROXY_ID,
  funcName: ComposableDefines = NUXT_I18N_COMPOSABLE_DEFINE_LOCALE
) {
  if ([...JS_EXTENSIONS, ...TS_EXTENSIONS].includes(ext)) {
    const code = readCode(absolutePath, ext)
    const parsed = parseCode(code, absolutePath)
    const anaylzed = scanProgram(parsed.program, funcName)
    if (virtualId === NUXT_I18N_RESOURCE_PROXY_ID) {
      !anaylzed && raiseSyntaxError(absolutePath)
      // prettier-ignore
      return anaylzed === 'arrow-function' || anaylzed === 'function'
        ? asVirtualId(`${virtualId}?target=${id}`)
        : id
    } else if (virtualId === NUXT_I18N_CONFIG_PROXY_ID) {
      !anaylzed && raiseSyntaxError(absolutePath)
      return asVirtualId(`${virtualId}?target=${id}&c=${getHash(absolutePath)}`)
    } else {
      return id
    }
  } else {
    return id
  }
}

const PARSE_CODE_CACHES = new Map<string, ReturnType<typeof _parseCode>>()

function parseCode(code: string, path: string) {
  if (PARSE_CODE_CACHES.has(path)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return PARSE_CODE_CACHES.get(path)!
  }

  const parsed = _parseCode(code, {
    allowImportExportEverywhere: true,
    sourceType: 'module'
  })

  PARSE_CODE_CACHES.set(path, parsed)
  return parsed
}

function scanProgram(program: File['program'], calleeName: string) {
  let ret: false | 'object' | 'function' | 'arrow-function' = false
  for (const node of program.body) {
    if (node.type === 'ExportDefaultDeclaration') {
      if (node.declaration.type === 'ObjectExpression') {
        ret = 'object'
        break
      } else if (
        node.declaration.type === 'CallExpression' &&
        node.declaration.callee.type === 'Identifier' &&
        node.declaration.callee.name === calleeName
      ) {
        const [fnNode] = node.declaration.arguments
        if (fnNode.type === 'FunctionExpression') {
          ret = 'function'
          break
        } else if (fnNode.type === 'ArrowFunctionExpression') {
          ret = 'arrow-function'
          break
        }
      }
    }
  }
  return ret
}

export function readCode(absolutePath: string, ext: string) {
  let code = readFileSync(absolutePath)
  if (TS_EXTENSIONS.includes(ext)) {
    const out = stripType(code, {
      transforms: ['jsx'],
      keepUnusedImports: true
    })
    code = out.code
  }
  return code
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

// TODO: remove `i18n:extend-messages` before v8 official release
function generateAdditionalMessages(value: Record<string, any>, dev: boolean): string {
  let genCode = 'Object({'
  for (const [locale, messages] of Object.entries(value)) {
    genCode += `${JSON.stringify(locale)}:[`
    for (const [, p] of Object.entries(messages)) {
      genCode += `() => Promise.resolve(${
        generateJSON(JSON.stringify(p), { type: 'bare', env: dev ? 'development' : 'production' }).code
      }),`
    }
    genCode += `],`
  }
  genCode += '})'
  return genCode
}

export function stringifyObj(obj: Record<string, any>): string {
  return `Object({${Object.entries(obj)
    .map(([key, value]) => `${JSON.stringify(key)}:${toCode(value)}`)
    .join(`,`)}})`
}

export function toCode(code: any): string {
  if (code === null) {
    return `null`
  }

  if (code === undefined) {
    return `undefined`
  }

  if (isString(code)) {
    return JSON.stringify(code)
  }

  if (isRegExp(code) && code.toString) {
    return code.toString()
  }

  if (isFunction(code) && code.toString) {
    return `(${code.toString().replace(new RegExp(`^${code.name}`), 'function ')})`
  }

  if (isArray(code)) {
    return `[${code.map(c => toCode(c)).join(`,`)}]`
  }

  if (isObject(code)) {
    return stringifyObj(code)
  }

  return code + ``
}

/* eslint-enable @typescript-eslint/no-explicit-any */
