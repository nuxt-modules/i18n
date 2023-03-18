import { defineEventHandler, readBody, setResponseHeader } from 'h3'
import { generateJSON } from '@intlify/bundle-utils'
import { prefixStorage } from 'unstorage'
// @ts-ignore TODO: fix resolve
import { useStorage } from '#imports'
// import { NUXT_I18N_PRECOMPILED_LOCALE_KEY } from '#build/i18n.options.mjs'

import type { Locale, LocaleMessages, DefineLocaleMessage } from 'vue-i18n'

const NUXT_I18N_PRECOMPILED_LOCALE_KEY = 'i18n-locales'
const localeStorage = prefixStorage(useStorage(), NUXT_I18N_PRECOMPILED_LOCALE_KEY.split('-').join(':'))

const resourceKey = (locale: Locale) => `${locale}.js`

export default defineEventHandler(async event => {
  const { locale, resource } = await readBody<{
    locale: Locale
    resource: LocaleMessages<DefineLocaleMessage>
  }>(event)

  // TODO: `locale` and `resource` should be validated
  if (!locale) {
    return ''
  }
  if (!resource) {
    return ''
  }

  let localeCode = await localeStorage.getItem(resourceKey(locale))
  if (!localeCode) {
    const { code } = generateJSON(JSON.stringify(resource), {
      env: process.dev ? 'development' : 'production'
    })
    await localeStorage.setItem(resourceKey(locale), code)
    localeCode = code
  }

  await setResponseHeader(event, 'content-type', 'text/javascript')
  return localeCode.toString()
})
