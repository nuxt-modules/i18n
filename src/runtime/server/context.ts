import type { LocaleMessages } from '@intlify/core'
import type { DefineLocaleMessage } from '@intlify/h3'
import { type H3Event, type H3EventContext, getRequestURL } from 'h3'
import { type ResolvedI18nOptions, setupVueI18nOptions } from '../shared/vue-i18n'
import { useRuntimeI18n } from '../shared/utils'
import { createLocaleConfigs, getDefaultLocaleForDomain } from '../shared/locales'

export function useI18nContext(event: H3Event) {
  if (event.context.nuxtI18n == null) {
    throw new Error('Nuxt I18n server context has not been set up yet.')
  }
  return event.context.nuxtI18n
}

export function tryUseI18nContext(event: H3Event) {
  return event.context.nuxtI18n
}

const getHost = (event: H3Event) => getRequestURL(event, { xForwardedHost: true }).host

export async function initializeI18nContext(event: H3Event) {
  const runtimeI18n = useRuntimeI18n(undefined, event)
  const defaultLocale: string = runtimeI18n.defaultLocale || ''
  const options = await setupVueI18nOptions(getDefaultLocaleForDomain(getHost(event)) || defaultLocale)
  const localeConfigs = createLocaleConfigs(options.fallbackLocale)
  const ctx = createI18nContext()

  ctx.vueI18nOptions = options
  ctx.localeConfigs = localeConfigs

  event.context.nuxtI18n = ctx
  return ctx
}

/**
 * Fetches the messages for the specified locale.
 * @internal
 */
export const fetchMessages = async (locale: string) => {
  const headers = new Headers({ 'x-nuxt-i18n': 'internal' })
  if (import.meta.dev) {
    headers.set('Cache-Control', 'no-cache')
  }
  return await $fetch<LocaleMessages<DefineLocaleMessage>>(`${__I18N_SERVER_ROUTE__}/${locale}/messages.json`, {
    headers,
  })
}

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
    },
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
      detectLocale?: string
      vueI18nOptions?: ResolvedI18nOptions
    }
  }
}
