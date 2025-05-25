import { stringify } from 'devalue'
import { defineI18nMiddleware } from '@intlify/h3'
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
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'

export default defineNitroPlugin(async nitro => {
  const runtime18n = useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig
  const defaultLocale: string = runtime18n.defaultLocale || ''

  const options = await setupVueI18nOptions(defaultLocale)
  const localeConfigs = createLocaleConfigs(options.fallbackLocale)

  nitro.hooks.hook('request', async (event: H3Event) => {
    event.context.nuxtI18n = createI18nContext()
    event.context.nuxtI18n.localeConfigs = localeConfigs
  })

  nitro.hooks.hook('render:html', (htmlContext, { event }) => {
    const ctx = tryUseI18nContext(event)
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
