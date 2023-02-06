import createDebug from 'debug'
import { isString, isRegExp, isFunction, isArray, isObject } from '@intlify/shared'
import { generateJSON } from '@intlify/bundle-utils'
import { NUXT_I18N_MODULE_ID } from './constants'
import { genImport, genSafeVariableName, genDynamicImport } from 'knitwork'
import { parse as parsePath, normalize } from 'node:path'

import type { NuxtI18nOptions, NuxtI18nInternalOptions, LocaleInfo } from './types'
import type { NuxtI18nOptionsDefault } from './constants'
import type { AdditionalMessages } from './messages'

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
  let genCode = ''
  const localeInfo = options.localeInfo || []
  const syncLocaleFiles = new Set<LocaleInfo>()
  const asyncLocaleFiles = new Set<LocaleInfo>()

  if (langDir) {
    for (const locale of localeInfo) {
      if (!syncLocaleFiles.has(locale) && !asyncLocaleFiles.has(locale)) {
        ;(lazy ? asyncLocaleFiles : syncLocaleFiles).add(locale)
      }
    }
  }

  const generatedImports = new Map<string, string>()
  const importMapper = new Map<string, string>()

  const buildImportKey = (root: string, dir: string, base: string) =>
    normalize(`${root ? `${root}/` : ''}${dir ? `${dir}/` : ''}${base}`)

  function generateSyncImports(gen: string, filepath?: string) {
    if (!filepath) {
      return gen
    }

    const { root, dir, base, ext } = parsePath(filepath)
    const key = buildImportKey(root, dir, base)
    if (!generatedImports.has(key)) {
      let loadPath = filepath
      if (langDir) {
        loadPath = resolveLocaleRelativePath(localesRelativeBase, langDir, filepath)
      }
      const assertFormat = ext.slice(1)
      const variableName = genSafeVariableName(`locale_${convertToImportId(key)}`)
      gen += `${genImport(loadPath, variableName, assertFormat ? { assert: { type: assertFormat } } : {})}\n`
      importMapper.set(key, variableName)
      generatedImports.set(key, loadPath)
    }

    return gen
  }

  for (const { file, files } of syncLocaleFiles) {
    ;(file ? [file] : files || []).forEach(f => {
      genCode = generateSyncImports(genCode, f)
    })
  }

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
          genCodes += `  ${rootKey}.${key} = ${toCode(value)}\n`
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
        return `${key}: ${toCode(value)}`
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
        for (const { code, file, files } of asyncLocaleFiles) {
          const dynamicPaths = file ? [file] : files || []
          codes += `  ${toCode(code)}: [${dynamicPaths.map(filepath => {
            const { root, dir, base } = parsePath(filepath)
            const key = buildImportKey(root, dir, base)
            const loadPath = resolveLocaleRelativePath(localesRelativeBase, langDir, filepath)
            return `{ key: ${toCode(loadPath)}, load: ${genDynamicImport(loadPath, { comment: `webpackChunkName: "lang_${normalizeWithUnderScore(key)}"` })} }`
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

  genCode += `export const NUXT_I18N_MODULE_ID = ${toCode(NUXT_I18N_MODULE_ID)}\n`
  genCode += `export const isSSG = ${toCode(misc.ssg)}\n`
  genCode += `export const isSSR = ${toCode(misc.ssr)}\n`

  debug('generate code', genCode)
  return genCode
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringifyObj(obj: Record<string, any>): string {
  return `Object({${Object.entries(obj)
    .map(([key, value]) => `${JSON.stringify(key)}:${toCode(value)}`)
    .join(`,`)}})`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
