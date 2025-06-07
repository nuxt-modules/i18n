import type { LocaleMessages } from '@intlify/core'
import type { DefineLocaleMessage } from '@intlify/h3'
import type { H3Event, H3EventContext } from 'h3'
import type { ResolvedI18nOptions } from '../shared/vue-i18n'

export function useI18nContext(event: H3Event) {
  if (event.context.nuxtI18n == null) {
    throw new Error('Nuxt I18n server context has not been set up yet.')
  }
  return event.context.nuxtI18n
}

export function tryUseI18nContext(event: H3Event) {
  return event.context.nuxtI18n
}

const headers = new Headers({ 'x-nuxt-i18n': 'internal' })
if (import.meta.dev) {
  headers.set('Cache-Control', 'no-cache')
}
/**
 * Fetches the messages for the specified locale.
 * @internal
 */
export const fetchMessages = async (locale: string) =>
  await $fetch<LocaleMessages<DefineLocaleMessage>>(`/_i18n/${locale}/messages.json`, { headers })

export function createI18nContext(): NonNullable<H3EventContext['nuxtI18n']> {
  return {
    messages: {},
    slp: {},
    localeConfigs: {},
    trackMap: {},
    vueI18nOptions: undefined,
    trackKey(key, locale) {
      this.trackMap[locale] ??= new Set<string>()
      this.trackMap[locale].add(key)
    }
  }
}

interface ServerLocaleConfig {
  /**
   * Message files (and its fallback locale message files) are cacheable
   */
  cacheable: boolean
  /**
   * Fallback locale codes
   */
  fallbacks: string[]
}

declare module 'h3' {
  interface H3EventContext {
    /** @internal */
    nuxtI18n?: {
      /**
       * Cached locale configurations based on runtime config
       * @internal
       */
      localeConfigs?: Record<string, ServerLocaleConfig>
      /**
       * SwitchLocalePath dynamic parameters state
       * @internal
       */
      slp: Record<string, unknown>
      /**
       * The loaded messages for the current request, used to insert into the rendered HTML for hydration
       * @internal
       */
      messages: LocaleMessages<DefineLocaleMessage>
      /**
       * The list of keys that are tracked for the current request
       * @internal
       */
      trackMap: Record<string, Set<string>>
      /**
       * Track message key for the current request
       * @internal
       */
      trackKey: (key: string, locale: string) => void

      vueI18nOptions?: ResolvedI18nOptions
    }
  }
}
