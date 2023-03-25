import { defineEventHandler, readBody, setResponseHeader, createError } from 'h3'
import { generateJSON } from '@intlify/bundle-utils'
import { prefixStorage } from 'unstorage'
// @ts-ignore TODO: fix resolve
import { useStorage, useRuntimeConfig } from '#imports'

import type { Locale, LocaleMessages, DefineLocaleMessage } from 'vue-i18n'

const NUXT_I18N_PRECOMPILED_LOCALE_KEY = 'i18n-locales'
const localeStorage = prefixStorage(useStorage(), NUXT_I18N_PRECOMPILED_LOCALE_KEY.split('-').join(':'))

const resourceKey = (locale: Locale) => `${locale}.js`

export default defineEventHandler(async event => {
  const { locale, resource } = await readBody<{
    locale: Locale
    resource: LocaleMessages<DefineLocaleMessage>
  }>(event)

  if (!locale) {
    throw createError({ statusMessage: `require the 'locale'`, statusCode: 400 })
  }
  if (!resource) {
    throw createError({ statusMessage: `require the 'resource'`, statusCode: 400 })
  }

  let localeCode = await localeStorage.getItem(resourceKey(locale))
  if (!localeCode) {
    const errors = [] as string[]
    const config = useRuntimeConfig()
    const { code } = generateJSON(JSON.stringify(resource), {
      env: process.dev ? 'development' : 'production',
      strictMessage: config.i18n.strictMessage,
      escapeHtml: config.i18n.escapeHtml,
      onError: error => {
        errors.push(error)
      }
    })
    if (errors.length > 0) {
      throw createError({ statusMessage: errors.join('|'), statusCode: 400 })
    }
    await localeStorage.setItem(resourceKey(locale), code)
    localeCode = code
  }

  await setResponseHeader(event, 'content-type', 'text/javascript')
  return localeCode.toString()
})
