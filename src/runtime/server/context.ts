import type { LocaleMessages } from '@intlify/core'
import type { DefineLocaleMessage } from '@intlify/h3'
import type { H3Event, H3EventContext } from 'h3'

export function useI18nContext(event: H3Event) {
  if (event.context.nuxtI18n == null) {
    throw new Error('Nuxt I18n server context has not been set up yet.')
  }
  return event.context.nuxtI18n
}

export function tryUseI18nContext(event: H3Event) {
  return event.context.nuxtI18n
}

/**
 * Fetches the messages for the specified locale.
 * @internal
 */
export const fetchMessages = async (locale: string) =>
  await $fetch<LocaleMessages<DefineLocaleMessage>>(`/_i18n/${locale}/messages.json`, {
    headers: { 'x-nuxt-i18n': 'internal' }
  })

type ContextParams = Pick<NonNullable<H3EventContext['nuxtI18n']>, 'getFallbackLocales' | 'localeConfigs'>
export function createI18nContext({
  getFallbackLocales,
  localeConfigs
}: ContextParams): NonNullable<H3EventContext['nuxtI18n']> {
  return {
    messages: {},
    getFallbackLocales,
    localeConfigs,
    trackedKeys: new Set<string>(),
    trackKey(key: string) {
      this.trackedKeys.add(key)
    }
  }
}

declare module 'h3' {
  interface H3EventContext {
    /** @internal */
    nuxtI18n?: {
      /**
       * Get the fallback locales for the specified locale
       * @internal
       */
      getFallbackLocales: (locale: string) => string[]
      localeConfigs: Record<string, { cacheable: boolean; fallbacks: string[] }>
      /**
       * The loaded messages for the current request, used to insert into the rendered HTML for hydration
       * @internal
       */
      messages: LocaleMessages<DefineLocaleMessage>
      /**
       * The list of keys that are tracked for the current request
       * @internal
       */
      trackedKeys: Set<string>
      /**
       * Track message key for the current request
       * @internal
       */
      trackKey: (key: string) => void
      /**
       * Cache lookup for locale and locale chain (locale + fallback locales)
       * @internal
       */
      cacheMap?: {
        /**
         * Map of locale codes to boolean values indicating if the locale is cacheable
         * @internal
         */
        locale: Map<string, boolean>
        /**
         * Map of locale codes to boolean values indicating if the locale + its fallback locales are cacheable
         * @internal
         */
        localeChain: Map<string, boolean>
      }
    }
  }
}
