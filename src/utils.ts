import { resolveFiles } from '@nuxt/kit'
import { parse } from 'pathe'
import { isObject, isString } from '@intlify/shared'
import { NUXT_I18N_MODULE_ID } from './constants'

import type { LocaleObject } from 'vue-i18n-routing'
import type { NuxtI18nOptions, LocaleInfo } from './types'

export function formatMessage(message: string) {
  return `[${NUXT_I18N_MODULE_ID}]: ${message}`
}

export function getNormalizedLocales(locales: NuxtI18nOptions['locales']): LocaleObject[] {
  locales = locales || []
  const normalized: LocaleObject[] = []
  for (const locale of locales) {
    if (isString(locale)) {
      normalized.push({ code: locale })
    } else {
      normalized.push(locale)
    }
  }
  return normalized
}

export async function resolveLocales(path: string, locales: LocaleObject[]): Promise<LocaleInfo[]> {
  const files = await resolveFiles(path, '**/*{json,json5,yaml,yml}')
  return files.map(file => {
    const parsed = parse(file)
    const locale = findLocales(locales, parsed.base)
    return locales == null
      ? {
          path: file,
          file: parsed.base,
          code: parsed.name
        }
      : Object.assign({ path: file }, locale)
  })
}

function findLocales(locales: NonNullable<NuxtI18nOptions['locales']>, filename: string) {
  // @ts-ignore
  const ret = locales.find((locale: string | LocaleObject) => isObject(locale) && locale.file === filename)
  return ret != null ? (ret as LocaleObject) : null
}
