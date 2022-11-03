import createDebug from 'debug'
import { isString, isRegExp, isFunction, isArray, isObject } from '@intlify/shared'
import { generateJSON } from '@intlify/bundle-utils'
import { NUXT_I18N_MODULE_ID } from './constants'
import { genImport, genSafeVariableName, genDynamicImport } from 'knitwork'
import { parse as parsePath } from 'pathe'

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
  options: LoaderOptions = {},
  dev = true
) {
  let genCode = ''
  const localeInfo = options.localeInfo || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { fallbackLocale } = (isObject(options.nuxtI18nOptions?.vueI18n) ? options.nuxtI18nOptions?.vueI18n : {}) as any
  const syncLocaleFiles = new Set<LocaleInfo>()
  const asyncLocaleFiles = new Set<LocaleInfo>()

  if (langDir) {
    if (fallbackLocale && isString(fallbackLocale)) {
      const localeObject = localeInfo.find(l => l.code === fallbackLocale)
      if (localeObject) {
        syncLocaleFiles.add(localeObject)
      }
    }
    for (const locale of localeInfo) {
      if (!syncLocaleFiles.has(locale) && !asyncLocaleFiles.has(locale)) {
        ;(lazy ? asyncLocaleFiles : syncLocaleFiles).add(locale)
      }
    }
  }

  const importMapper = new Map<string, string>()
  for (const { code, path } of syncLocaleFiles) {
    importMapper.set(code, genSafeVariableName(`locale_${code}`))
    genCode += `${genImport(path, genSafeVariableName(`locale_${code}`))}\n`
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
            ? `async (context) => ${generateVueI18nOptions(value, dev)}\n`
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
        for (const { code } of syncLocaleFiles) {
          codes += `  ${toCode(code)}: () => Promise.resolve(${importMapper.get(code)}),\n`
        }
        for (const { code, path } of asyncLocaleFiles) {
          codes += `  ${toCode(code)}: ${genDynamicImport(path, { comment: `webpackChunkName: "lang-${code}"` })},\n`
        }
      }
      codes += `}\n`
      return codes
    } else if (rootKey === 'additionalMessages') {
      return `export const ${rootKey} = ${generaeteAdditionalMessages(rootValue, dev)}\n`
	  } else {
	    return `export const ${rootKey} = ${toCode(rootValue)}\n`
	  }
  }).join('\n')}`

  genCode += `export const NUXT_I18N_MODULE_ID = ${toCode(NUXT_I18N_MODULE_ID)}\n`

  debug('generate code', genCode)
  return genCode
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
function generaeteAdditionalMessages(value: Record<string, any>, dev: boolean): string {
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
    return `(${code.toString()})`
  }

  if (isArray(code)) {
    return `[${code.map(c => toCode(c)).join(`,`)}]`
  }

  if (isObject(code)) {
    return stringifyObj(code)
  }

  return code + ``
}
