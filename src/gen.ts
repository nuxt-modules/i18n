/* eslint-disable @typescript-eslint/no-explicit-any */

import createDebug from 'debug'
import { isString, isRegExp, isFunction, isArray, isObject } from '@intlify/shared'
import { generateJSON } from '@intlify/bundle-utils'
import { NUXT_I18N_MODULE_ID, NUXT_I18N_RESOURCE_PROXY_ID, NUXT_I18N_PRECOMPILE_ENDPOINT } from './constants'
import { genImport, genSafeVariableName, genDynamicImport } from 'knitwork'
import { parse as parsePath, normalize } from 'pathe'
import fs from 'node:fs'
// @ts-ignore
import { transform as stripType } from '@mizchi/sucrase'
import { parse as _parseCode } from '@babel/parser'
import { asVirtualId } from './proxy'

import type { NuxtI18nOptions, NuxtI18nInternalOptions, LocaleInfo } from './types'
import type { NuxtI18nOptionsDefault } from './constants'
import type { AdditionalMessages } from './messages'
import type { File } from '@babel/types'

export type LoaderOptions = {
  localeCodes?: string[]
  localeInfo?: LocaleInfo[]
  nuxtI18nOptions?: NuxtI18nOptions
  nuxtI18nOptionsDefault?: NuxtI18nOptionsDefault
  nuxtI18nInternalOptions?: NuxtI18nInternalOptions
  additionalMessages?: AdditionalMessages
}

const debug = createDebug('@nuxtjs/i18n:gen')

export function generateLoaderOptions(
  lazy: NonNullable<NuxtI18nOptions['lazy']>,
  langDir: NuxtI18nOptions['langDir'],
  localesRelativeBase: string,
  options: LoaderOptions = {},
  misc: {
    dev: boolean
    ssg: boolean
    ssr: boolean
  } = { dev: true, ssg: false, ssr: true }
) {
  const generatedImports = new Map<string, string>()
  const importMapper = new Map<string, string>()

  const convertToPairs = ({ file, files, path, paths }: LocaleInfo) => {
    const _files = file ? [file] : files || []
    const _paths = path ? [path] : paths || []
    return _files.map((f, i) => ({ file: f, path: _paths[i] }))
  }

  const buildImportKey = (root: string, dir: string, base: string) =>
    normalize(`${root ? `${root}/` : ''}${dir ? `${dir}/` : ''}${base}`)

  function generateSyncImports(gen: string, absolutePath: string, relativePath?: string) {
    if (!relativePath) {
      return gen
    }

    const { root, dir, base, ext } = parsePath(relativePath)
    const key = buildImportKey(root, dir, base)
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
          const optionLoaderVariable = `${key}OptionsLoader`
          genCodes += `  const ${optionLoaderVariable} = ${isObject(value)
            ? `async (context) => ${generateVueI18nOptions(value, misc.dev)}\n`
            : isString(value)
              ? `async (context) => import(${toCode(value)}).then(r => (r.default || r)(context))\n`
              : `async (context) => ${toCode({})}\n`
          }`
          genCodes += `  ${rootKey}.${key} = await ${optionLoaderVariable}(context)\n`
          if (isString(value)) {
            const parsedLoaderPath = parsePath(value)
            const loaderFilename = `${parsedLoaderPath.name}${parsedLoaderPath.ext}`
            genCodes += `  if (${rootKey}.${key}.messages) { console.warn("[${NUXT_I18N_MODULE_ID}]: Cannot include 'messages' option in '${loaderFilename}'. Please use Lazy-load translations."); ${rootKey}.${key}.messages = {}; }\n`
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
            const key = buildImportKey(root, dir, base)
            return `{ key: ${toCode(generatedImports.get(key))}, load: () => Promise.resolve(${importMapper.get(key)}) }`
          })}],\n`
        }
        for (const localeInfo of asyncLocaleFiles) {
          codes += `  ${toCode(localeInfo.code)}: [${convertToPairs(localeInfo).map(({ file, path }) => {
            const { root, dir, base, ext } = parsePath(file)
            const key = buildImportKey(root, dir, base)
            const loadPath = resolveLocaleRelativePath(localesRelativeBase, langDir, file)
            return `{ key: ${toCode(loadPath)}, load: ${genDynamicImport(genImportSpecifier(loadPath, ext, path), { comment: `webpackChunkName: "lang_${normalizeWithUnderScore(key)}"` })} }`
          })}],\n`
        }
      }
      codes += `}\n`
      return codes
    } else if (rootKey === 'additionalMessages') {
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
  genCode += `export const isSSG = ${toCode(misc.ssg)}\n`
  genCode += `export const isSSR = ${toCode(misc.ssr)}\n`

  debug('generate code', genCode)
  return genCode
}

const TARGET_TS_EXTENSIONS = ['.ts', '.cts', '.mts']

function genImportSpecifier(id: string, ext: string, absolutePath: string) {
  if (['.js', '.cjs', '.mjs', ...TARGET_TS_EXTENSIONS].includes(ext)) {
    const code = readCode(absolutePath, ext)
    const parsed = parseCode(code, absolutePath)
    const anaylzed = scanProgram(parsed.program)
    // prettier-ignore
    return anaylzed === 'arrow-function' || anaylzed === 'function'
      ? `${asVirtualId(NUXT_I18N_RESOURCE_PROXY_ID)}?target=${id}`
      : id
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

function scanProgram(program: File['program']) {
  let ret: false | 'object' | 'function' | 'arrow-function' = false
  for (const node of program.body) {
    if (node.type === 'ExportDefaultDeclaration') {
      if (node.declaration.type === 'ObjectExpression') {
        ret = 'object'
        break
      } else if (node.declaration.type === 'FunctionDeclaration') {
        ret = 'function'
        break
      } else if (node.declaration.type === 'ArrowFunctionExpression') {
        ret = 'arrow-function'
        break
      }
    }
  }
  return ret
}

export function readCode(absolutePath: string, ext: string) {
  let code = fs.readFileSync(absolutePath, 'utf-8').toString()
  if (TARGET_TS_EXTENSIONS.includes(ext)) {
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

function generateVueI18nOptions(options: Record<string, any>, dev: boolean): string {
  let genCode = 'Object({'
  for (const [key, value] of Object.entries(options)) {
    if (key === 'messages') {
      genCode += `${JSON.stringify(key)}: Object({`
      for (const [locale, localeMessages] of Object.entries(value)) {
        genCode += `${JSON.stringify(locale)}:${
          generateJSON(JSON.stringify(localeMessages), { type: 'bare', env: dev ? 'development' : 'production' }).code
        },`
      }
      genCode += '}),'
    } else {
      genCode += `${JSON.stringify(key)}:${toCode(value)},`
    }
  }
  genCode += '})'
  return genCode
}

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
