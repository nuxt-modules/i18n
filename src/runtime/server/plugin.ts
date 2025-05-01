import { stringify } from 'devalue'
import { defineI18nMiddleware } from '@intlify/h3'
import { useStorage, useRuntimeConfig, defineNitroPlugin } from 'nitropack/runtime'
import { cachedMergedMessages } from './utils/messages'
import { localeDetector } from '#internal/i18n/locale.detector.mjs'
import { createLocaleFromRouteGetter } from '#i18n-kit/routing'
import { localeCodes, vueI18nConfigs } from '#internal/i18n/options.mjs'
import { createDefaultLocaleDetector, createUserLocaleDetector } from './utils/locale-detector'
import { loadVueI18nOptions, makeFallbackLocaleCodes } from '../messages'
// @ts-expect-error virtual file
import { appId } from '#internal/nuxt.config.mjs'

import type { H3Event, H3EventContext } from 'h3'
import type { CoreOptions, LocaleMessages } from '@intlify/core'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export default defineNitroPlugin(async nitro => {
  if (import.meta.dev) {
    const cache = useStorage('cache')
    const cachedKeys = await cache.getKeys('nitro:functions:i18n')
    for (const key of cachedKeys) {
      await cache.remove(key)
    }
  }

  // load initial locale messages for intlify/h3
  // `defineI18nMiddleware` options (internally, options passed to`createCoreContext` in intlify / core) are compatible with vue-i18n options
  const options = await loadVueI18nOptions(vueI18nConfigs)
  const fallbackLocale = (options.fallbackLocale = options.fallbackLocale ?? false)
  options.messages = options.messages || {}
  for (const locale in localeCodes) {
    options.messages[locale] ??= {}
  }

  const runtimeI18n = useRuntimeConfig().public.i18n as unknown as I18nPublicRuntimeConfig
  const initialLocale = runtimeI18n.defaultLocale || options.locale || 'en-US'

  const localeFromRoute = createLocaleFromRouteGetter({
    separator: __ROUTE_NAME_SEPARATOR__,
    defaultSuffix: __ROUTE_NAME_DEFAULT_SUFFIX__,
    localeCodes
  })

  const defaultLocaleDetector = createDefaultLocaleDetector({
    defaultLocale: initialLocale,
    tryRouteLocale: (event: H3Event) => localeFromRoute(event.path) || null
  })

  const getFallbackLocales = (locale: string) => makeFallbackLocaleCodes(fallbackLocale, [locale])

  // load initial messages
  if (!__LAZY_LOCALES__) {
    await Promise.all(localeCodes.map(locale => cachedMergedMessages(locale, getFallbackLocales(locale))))
  }

  nitro.hooks.hook('request', async (event: H3Event) => {
    const ctx = createI18nContext({ getFallbackLocales })
    event.context.nuxtI18n = ctx

    // if (import.meta.dev) return
    ctx.locale = defaultLocaleDetector(event)
    ctx.fallbackLocales = ctx.getFallbackLocales(ctx.locale)
    ctx.messages = await ctx.getMergedMessages(ctx.locale, ctx.fallbackLocales)
  })

  nitro.hooks.hook('render:html', (htmlContext, { event }) => {
    const ctx = tryUseI18nContext(event)
    // if(import.meta.dev) return
    if (ctx == null || Object.keys(ctx.messages ?? {}).length == 0) return
    // const subset: Record<string, LocaleMessages<DefineLocaleMessage>> = {}
    // for (const locale of ctx.localeChain) {
    //   subset[locale] = ctx.messages[locale]
    // }

    try {
      htmlContext.bodyAppend.unshift(
        `<script type="application/json" data-nuxt-i18n="${appId}">${stringify(ctx.messages)}</script>`
      )
    } catch (_) {
      console.log(_)
    }
  })

  // enable server-side translations and user locale-detector
  if (localeDetector != null) {
    const i18nMiddleware = defineI18nMiddleware({
      ...(options as CoreOptions),
      locale: createUserLocaleDetector(initialLocale, fallbackLocale)
    })

    nitro.hooks.hook('request', i18nMiddleware.onRequest)
    nitro.hooks.hook('afterResponse', i18nMiddleware.onAfterResponse)
  }
})

function createI18nContext(opts: {
  getFallbackLocales: (locale: string) => string[]
}): NonNullable<H3EventContext['nuxtI18n']> {
  return {
    locale: undefined!,
    fallbackLocales: undefined!,
    getFallbackLocales: opts.getFallbackLocales,
    messages: {},
    getMergedMessages: cachedMergedMessages
  }
}

export function useI18nContext(event: H3Event) {
  if (event.context.nuxtI18n == null) {
    throw new Error('Nuxt I18n server context has not been set up yet.')
  }
  return event.context.nuxtI18n
}

export function tryUseI18nContext(event: H3Event) {
  return event.context.nuxtI18n
}

declare module 'h3' {
  interface H3EventContext {
    /** @internal */
    nuxtI18n?: {
      /**
       * The detected locale for the current request
       * @internal
       */
      locale: string
      /**
       * The detected fallback locales for the current request
       * @internal
       */
      fallbackLocales: string[]
      /**
       * Get the fallback locales for the specified locale
       * @internal
       */
      getFallbackLocales: (locale: string) => string[]
      /**
       * The loaded messages for the current request, used to insert into the rendered HTML for hydration
       * @internal
       */
      messages: LocaleMessages<Record<string, string>>
      /**
       * Cached method to get the merged messages for the specified locale and fallback locales
       * @internal
       */
      getMergedMessages: (locale: string, fallbackLocales: string[]) => Promise<LocaleMessages<Record<string, string>>>
    }
  }
}
