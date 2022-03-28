import { isVue3 } from 'vue-demi'
import { findBrowserLocale } from 'vue-i18n-routing'
import { parseAcceptLanguage } from '#build/i18n.utils.mjs'

import type { NuxtI18nInternalOptions } from '#build/i18n.options.mjs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getBrowserLocale(options: Required<NuxtI18nInternalOptions>, context?: any): string | undefined {
  let ret: string | undefined

  if (process.client) {
    if (navigator.languages) {
      // get browser language either from navigator if running on client side, or from the headers
      ret = findBrowserLocale(options.__normalizedLocales, navigator.languages as string[])
    }
  } else if (process.server) {
    if (!isVue3) {
      if (context.req && typeof context.req.headers['accept-language'] !== 'undefined') {
        ret = findBrowserLocale(
          options.__normalizedLocales,
          parseAcceptLanguage(context.req.headers['accept-language'])
        )
      }
    } else {
      // TODO: should implement compability for options API style
      throw new Error('Not implement for nuxt3 option3 API style')
    }
  }

  return ret
}
