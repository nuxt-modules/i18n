import type { LocaleMessages } from '@intlify/core'
import type { DefineLocaleMessage } from '@intlify/h3'
import { deepCopy } from '@intlify/shared'
import { type ServerEvent, fetchInternal, useRuntimeConfig } from '#i18n-server-runtime'
import { type ResolvedI18nOptions, setupVueI18nOptions } from '../shared/vue-i18n'
import { createLocaleConfigs, resolveDefaultLocale } from '../shared/locales'
import { cloneDeep } from '../shared/messages'
import { getRequestHost } from '../shared/request'
import { getMergedMessages } from './utils/messages'

import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { ServerRedirect } from './runtime/types'

export function useI18nContext(event: ServerEvent) {
  const ctx = tryUseI18nContext(event)
  if (ctx == null) {
    throw new Error('Nuxt I18n server context has not been set up yet.')
  }
  return ctx
}

export function tryUseI18nContext(event: ServerEvent) {
  return (event.context as I18nEventContext).nuxtI18n
}

export async function initializeI18nContext(event: ServerEvent) {
  const runtimeI18n = useRuntimeConfig(event).public.i18n as unknown as I18nPublicRuntimeConfig
  const defaultLocale: string = runtimeI18n.defaultLocale || ''
  const options = await setupVueI18nOptions(resolveDefaultLocale(getRequestHost(event), defaultLocale))
  const localeConfigs = createLocaleConfigs(options.fallbackLocale)
  const ctx = createI18nContext()

  ctx.vueI18nOptions = options
  ctx.localeConfigs = localeConfigs

  ;(event.context as I18nEventContext).nuxtI18n = ctx
  return ctx
}

/**
 * Fetches the messages for the specified locale.
 * @internal
 */
export const fetchMessages = async (event: ServerEvent, locale: string) => {
  const headers = new Headers({ 'x-nuxt-i18n': 'internal' })
  if (import.meta.dev) {
    headers.set('Cache-Control', 'no-cache')
  }
  return await fetchInternal<LocaleMessages<DefineLocaleMessage>>(
    event,
    `${__I18N_SERVER_ROUTE__}/${__I18N_LOCALE_HASHES__[locale]}/${locale}/messages.json`,
    { headers },
  )
}

export function createI18nContext(): I18nServerContext {
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
    async loadMessages(locale: string) {
      const messages = (await getMergedMessages(locale, this.localeConfigs?.[locale]?.fallbacks ?? [])) ?? {}
      // only the payload reads `ctx.messages`, and copying the full tree per request is expensive
      if (__I18N_PRELOAD__) {
        deepCopy(messages, this.messages)
      }
      // vue-i18n rewrites flat keys in place, so it can't be handed cached messages
      return this.vueI18nOptions?.flatJson ? cloneDeep(messages) : messages
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

/** @internal */
export interface I18nServerContext {
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
  /**
   * Load merged messages for a locale, skipping the messages endpoint round-trip
   * @internal
   */
  loadMessages: (locale: string) => Promise<LocaleMessages<DefineLocaleMessage>>
  detectLocale?: string
  /**
   * Redirect resolved for the current page request
   * @internal
   */
  redirect?: ServerRedirect
  vueI18nOptions?: ResolvedI18nOptions
}

interface I18nEventContext {
  nuxtI18n?: I18nServerContext
}

declare module 'h3' {
  interface H3EventContext extends I18nEventContext {}
}
