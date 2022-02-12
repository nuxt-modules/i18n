import createDebug from 'debug'
import { isString, isRegExp, isFunction, isArray, isObject } from '@intlify/shared'
import { templateUtils } from '@nuxt/kit'
import { genImport } from 'knitwork'

import type { NuxtI18nOptions, LocaleInfo } from './types'

export type LoaderOptions = {
  localeCodes?: string[]
  localeInfo?: LocaleInfo[]
  nuxtI18nOptions?: NuxtI18nOptions
}

const debug = createDebug('@nuxtjs/i18n:gen')

export function generateLoaderOptions(options: LoaderOptions = {}) {
  // TODO: lazy loading local info

  // prettier-ignore
  const genCode = `${Object.entries(options).map(([rootKey, rootValue]) => {
    if (rootKey === 'nuxtI18nOptions') {
      return `export const ${rootKey} = Object({${Object.entries(rootValue).map(([key, value]) => {
        if (key === 'vueI18n') {
          return `${key}: ${isObject(value)
            ? toCode(value)
            : isString(value)
              ? `(context) => import(${toCode(value)}).then(r => (r.default || r)(context))`
              : `${toCode({})}`
          }`
        } else {
          return `${key}: ${toCode(value)}`
        }
      }).join(`,`)}})`
    } else if (rootKey === 'localeInfo') {
      const localeInfo = options.localeInfo || []
      const importMapper = new Map<string, string>()
      localeInfo.forEach(({ code }) => {
        importMapper.set(code, templateUtils.importName(`locale_${code}`))
      })
      return `${localeInfo.map(l => genImport(l.path, importMapper.get(l.code))).join(`\n`)}
export const messages = () => Promise.resolve(Object({${[...importMapper].map(i => `${templateUtils.serialize(i[0])}:${i[1]}`).join(`,`)}}))`
	  } else {
	    return `export const ${rootKey} = ${toCode(rootValue)}`
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
