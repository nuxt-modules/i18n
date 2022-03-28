import { isVue3 } from 'vue-demi'
import { useRequestHeaders } from '#app'
import { findBrowserLocale } from 'vue-i18n-routing'

import type { Composer } from '@intlify/vue-i18n-bridge'
import type { NuxtI18nInternalOptions } from '#build/i18n.options.mjs'

/**
 * Parses locales provided from browser through `accept-language` header.
 *
 * @param input - Accept-Language header value.
 * @return An array of locale codes. Priority determined by order in array.
 */
export function parseAcceptLanguage(input: string): string[] {
  // Example input: en-US,en;q=0.9,nb;q=0.8,no;q=0.7
  // Contains tags separated by comma.
  // Each tag consists of locale code (2-3 letter language code) and optionally country code
  // after dash. Tag can also contain score after semicolon, that is assumed to match order
  // so it's not explicitly used.
  return input.split(',').map(tag => tag.split(';')[0])
}

export async function loadAndSetLocale(newLocale: string, i18n: Composer /*, { initialSetup = false } = {}*/) {
  if (!newLocale) {
    return
  }

  // abort if different domains option enabled
  // if (!initialSetup && i18n.differentDomains) {
  //   return
  // }

  const oldLocale = i18n.locale.value as string
  if (newLocale === oldLocale) {
    return
  }

  i18n.locale.value = newLocale
  console.log('loadAndSetLocale', newLocale, oldLocale, i18n)
}

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
      const headers = useRequestHeaders(['accept-language'])
      if (headers['accept-language']) {
        ret = findBrowserLocale(options.__normalizedLocales, parseAcceptLanguage(headers['accept-language']))
      }
    }
  }

  return ret
}
