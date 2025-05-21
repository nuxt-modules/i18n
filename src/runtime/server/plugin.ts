import { stringify } from 'devalue'
import { defineI18nMiddleware } from '@intlify/h3'
import { isString } from '@intlify/shared'
import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import { tryUseI18nContext, createI18nContext } from './context'
import { createUserLocaleDetector } from './utils/locale-detector'
import { pickNested } from './utils/messages-utils'
import { createLocaleConfigs } from '../shared/locales'
import { setupVueI18nOptions } from '../shared/vue-i18n'
// @ts-expect-error virtual file
import { appId } from '#internal/nuxt.config.mjs'
import { localeDetector } from '#internal/i18n/locale.detector.mjs'

import type { H3Event } from 'h3'
import type { CoreOptions } from '@intlify/core'

import { localeCodes } from '#internal/i18n/options.mjs'
import { genString } from 'knitwork'
import type { I18nPublicRuntimeConfig, RootRedirectOptions } from '#internal-i18n-types'

export default defineNitroPlugin(async nitro => {
  const runtimeI18n = useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig
  const { useCookie, cookieKey } = runtimeI18n.detectBrowserLanguage || {}
  const defaultLocale: string = runtimeI18n.defaultLocale || ''
  const options = await setupVueI18nOptions(defaultLocale)
  const localeConfigs = createLocaleConfigs(options.fallbackLocale)

  nitro.hooks.hook('request', async (event: H3Event) => {
    event.context.nuxtI18n = createI18nContext()
    event.context.nuxtI18n.localeConfigs = localeConfigs
  })

  function getPrefixRedirectionScript() {
    if (runtimeI18n.rootRedirect) {
      return `
  if(${JSON.stringify(!!runtimeI18n.rootRedirect)}) {
    window.location.replace('${isString(runtimeI18n.rootRedirect) ? runtimeI18n.rootRedirect : (runtimeI18n.rootRedirect as RootRedirectOptions).path}');     
  }`
    }
    return `
  function getCookieValue(cookieName) {
    if (${JSON.stringify(!useCookie)}) return '';
    for (const cookie of document.cookie.split('; ')) {
      const [name, value] = cookie.split('=');
      if (name === ${genString(cookieKey || __DEFAULT_COOKIE_KEY__)}) return value;
    }
  }
  const locale = getCookieValue() || navigator.language;
  const locales = ${JSON.stringify(localeCodes)};
  const defaultLocale = ${genString(options.locale || localeCodes[0])};
  window.location.replace('/' + (locales.includes(locale) ? locale : defaultLocale));`
  }
  const ssgPrefixRedirectionScript =
    __IS_SSG__ && __I18N_STRATEGY__ === 'prefix' && `<script>${getPrefixRedirectionScript()}</script>`

  nitro.hooks.hook('render:html', (htmlContext, { event }) => {
    const ctx = tryUseI18nContext(event)
    if (ssgPrefixRedirectionScript && event.path === '/') {
      htmlContext.body.length = 0
      htmlContext.bodyAppend.unshift(ssgPrefixRedirectionScript)
      return
    }

    if (__I18N_PRELOAD__) {
      if (ctx == null || Object.keys(ctx.messages ?? {}).length == 0) return

      // only include the messages used in the current page
      if (__I18N_STRIP_UNUSED__ && !__IS_SSG__) {
        const trackedLocales = Object.keys(ctx.trackMap)
        for (const locale of Object.keys(ctx.messages)) {
          if (!trackedLocales.includes(locale)) {
            ctx.messages[locale] = {}
            continue
          }

          const usedKeys = Array.from(ctx.trackMap[locale])
          ctx.messages[locale] = pickNested(usedKeys, ctx.messages[locale]) as unknown as Record<string, string>
        }
      }

      const stringified = stringify(ctx.messages)
      if (import.meta.dev) {
        const size = getStringSizeKB(stringified)
        if (size > 10) {
          console.log(
            `Preloading a large messages object for ${Object.keys(ctx.messages).length} locales: ${size.toFixed(2)} KB`
          )
        }
      }

      try {
        htmlContext.bodyAppend.unshift(
          `<script type="application/json" data-nuxt-i18n="${appId}">${stringified}</script>`
        )
      } catch (_) {
        console.log(_)
      }
    }

    if (__I18N_STRICT_SEO__) {
      const raw = JSON.stringify(ctx?.slp ?? {})
      const safe = raw
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')
      htmlContext.head.push(`<script type="application/json" data-nuxt-i18n-slp="${appId}">${safe}</script>`)
    }
  })

  // enable server-side translations and user locale-detector
  if (localeDetector != null) {
    const options = await setupVueI18nOptions(defaultLocale)
    const i18nMiddleware = defineI18nMiddleware({
      ...(options as CoreOptions),
      locale: createUserLocaleDetector(options.locale, options.fallbackLocale)
    })

    nitro.hooks.hook('request', i18nMiddleware.onRequest)
    nitro.hooks.hook('afterResponse', i18nMiddleware.onAfterResponse)
  }
})

function getStringSizeKB(str: string): number {
  const encoder = new TextEncoder()
  const encoded = encoder.encode(str)
  return encoded.length / 1024
}
