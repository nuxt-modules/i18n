import createDebug from 'debug'
import { isString, isRegExp, isFunction, isArray, isObject } from '@intlify/shared'
import { templateUtils } from '@nuxt/kit'
import { genImport } from 'knitwork'

import type { NuxtI18nOptions, NuxtI18nInternalOptions, LocaleInfo, NoNullable } from './types'
import type { NuxtI18nOptionsDefault } from './constants'

export type LoaderOptions = {
  localeCodes?: string[]
  localeInfo?: LocaleInfo[]
  nuxtI18nOptions?: NuxtI18nOptions
  nuxtI18nOptionsDefault?: NuxtI18nOptionsDefault
  nuxtI18nInternalOptions?: NuxtI18nInternalOptions
}

const debug = createDebug('@nuxtjs/i18n:gen')

export function generateLoaderOptions(
  lazy: NoNullable<NuxtI18nOptions['lazy']>,
  langDir: NuxtI18nOptions['langDir'],
  options: LoaderOptions = {}
) {
  // TODO: lazy loading local info
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
    importMapper.set(code, templateUtils.importName(`locale_${code}`))
    genCode += `${genImport(path, templateUtils.importName(`locale_${code}`))}\n`
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
            ? `async (context) => ${toCode(value)}\n`
            : isString(value)
              ? `async (context) => import(${toCode(value)}).then(r => (r.default || r)(context))\n`
              : `async (context) => ${toCode({})}\n`
          }`
          genCodes += `  ${rootKey}.${key} = await ${optionLoaderVariable}(context)\n`
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
      let codes = `export const loadMessages = async () => {\n`
      codes += `  const messages = Object({})\n`
      if (langDir) {
        for (const { code } of syncLocaleFiles) {
          codes += `  messages[${toCode(code)}] = ${importMapper.get(code)}\n`
        }
        for (const { code, path } of asyncLocaleFiles) {
          codes += `  messages[${toCode(code)}] = await import(${toCode(path)} /* webpackChunkName: ${toCode(path)} */).then(r => r.default || r)\n`
        }
      }
      codes += `  return Promise.resolve(messages)\n`
      codes += `}\n`
      return codes
	  } else {
	    return `export const ${rootKey} = ${toCode(rootValue)}\n`
	  }
  }).join('\n')}`

  debug('generate code', genCode)
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
