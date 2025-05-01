import type { LocaleMessages } from '@intlify/core'
import type { H3Event, H3EventContext } from 'h3'
import { cachedMergedMessages } from './utils/messages'

export function useI18nContext(event: H3Event) {
  if (event.context.nuxtI18n == null) {
    throw new Error('Nuxt I18n server context has not been set up yet.')
  }
  return event.context.nuxtI18n
}

export function tryUseI18nContext(event: H3Event) {
  return event.context.nuxtI18n
}

export function createI18nContext(opts: {
  getFallbackLocales: (locale: string) => string[]
}): NonNullable<H3EventContext['nuxtI18n']> {
  return {
    locale: undefined!,
    fallbackLocales: undefined!,
    getFallbackLocales: opts.getFallbackLocales,
    messages: {},
    getMergedMessages: cachedMergedMessages,
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
    }
  }
}
