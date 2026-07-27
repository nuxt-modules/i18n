import { isRef, unref } from 'vue'

import { useCookie, useRequestURL, useState } from '#imports'
import { localeLoaders } from '#build/i18n-options.mjs'
import { cloneDeep, fillMissing, getLocaleMessagesMergedCached, warnMissedMessageFunctions } from './shared/messages'
import { createComposableContext } from './composable-context'
import { getComposer, getI18nTarget } from './compatibility'
import { domainFromLocale } from './shared/domain'
import { isSupportedLocale } from './shared/locales'
import { resolveRootRedirect, useI18nDetection, useRuntimeI18n } from './shared/utils'
import { joinURL } from 'ufo'
import { isFunction, isString } from '@intlify/shared'

import type { NuxtApp } from '#app'
import type { Composer, DefineLocaleMessage, I18n, Locale, LocaleMessages } from 'vue-i18n'
import type { ComposableContext } from './composable-context'
import type {
  BaseUrlResolveHandler,
  DetectBrowserLanguageOptions,
  I18nPublicRuntimeConfig,
  NormalizedLocaleObject,
} from '#internal-i18n-types'

export const useLocaleConfigs = () =>
  useState<Record<string, { cacheable: boolean, fallbacks: string[] }> | undefined>(
    'i18n:cached-locale-configs',
    () => undefined,
  )

export const useResolvedLocale = () => useState<string>('i18n:resolved-locale', () => '')

/**
 * @internal
 */
export interface NuxtI18nContext {
  vueI18n: I18n
  config: I18nPublicRuntimeConfig
  /** Initial request/visit */
  initial: boolean
  /** Locale messages attached during SSR and loaded during hydration */
  preloaded: boolean
  /** Whether a locale's messages have to be produced by running its loaders */
  usesRuntimeLoaders: (locale: Locale) => boolean
  rootRedirect: { path: string, code: number } | undefined
  redirectStatusCode: number
  /** Get default locale */
  getDefaultLocale: () => string
  /** Get current locale */
  getLocale: () => string
  /** Set locale directly  */
  setLocale: (locale: string) => Promise<void>
  /** Set locale - suspend if `skipSettingLocaleOnNavigate` is enabled  */
  setLocaleSuspend: (locale: string) => Promise<void>
  /** Get normalized runtime locales */
  getLocales: () => NormalizedLocaleObject[]
  /** Set locale to locale cookie */
  setCookieLocale: (locale: string) => void
  /** Get current base URL */
  getBaseUrl: (locale?: string) => string
  /** Load locale messages */
  loadMessages: (locale: Locale) => Promise<void>
  composableCtx: ComposableContext
}

/**
 * Returns a getter resolving the base URL for a locale, joined with `app.baseURL` exactly
 * once - locale domains and `baseUrl` are configured without it (#3628, #3887).
 */
export function createBaseUrlGetter(opts: {
  baseUrl: string | (() => string) | undefined
  appBase: string
  domains: boolean
  defaultLocale: string
  getDomainFromLocale: (locale: string) => string | undefined
}): (locale?: string) => string {
  const { baseUrl, appBase, domains, defaultLocale, getDomainFromLocale } = opts
  const base = isFunction(baseUrl)
    ? baseUrl
    : () => (domains && defaultLocale && getDomainFromLocale(defaultLocale)) || baseUrl || ''
  return locale => joinURL((locale && getDomainFromLocale(locale)) || base(), appBase)
}

function useI18nCookie({ cookieCrossOrigin, cookieDomain, cookieSecure, cookieKey }: DetectBrowserLanguageOptions) {
  const date = new Date()
  return useCookie<string | undefined>(cookieKey || __DEFAULT_COOKIE_KEY__, {
    path: '/',
    readonly: false,
    expires: new Date(date.setDate(date.getDate() + 365)),
    sameSite: cookieCrossOrigin ? 'none' : 'lax',
    domain: cookieDomain || undefined,
    secure: cookieCrossOrigin || cookieSecure,
  })
}

type MessageStore = Pick<Composer, 'getLocaleMessage' | 'setLocaleMessage' | 'mergeLocaleMessage'>

/**
 * Returns a function installing loaded messages into `i18n` by reference, with any messages the
 * vue-i18n config already put there filled in underneath. Installed trees may be shared with the
 * message cache, so `mergeLocaleMessage` - which deep copies into its target - gets a private
 * copy first.
 *
 * Patches the composer, not the VueI18n facade: legacy `useI18n()` and `<i18n>` blocks reach
 * composer methods directly, and the facade delegates to it at call time.
 * @internal exported for testing
 */
export function createMessageInstaller(i18n: MessageStore) {
  const byRef = new Set<string>()
  const merge = i18n.mergeLocaleMessage.bind(i18n) as (locale: string, message: object) => void
  const set = i18n.setLocaleMessage.bind(i18n) as (locale: string, message: object) => void

  i18n.mergeLocaleMessage = ((locale: string, message: object) => {
    // `deepCopy` shares arrays, which would leave the copy aliased into the cache
    if (byRef.delete(locale)) {
      set(locale, cloneDeep(i18n.getLocaleMessage(locale)))
    }
    merge(locale, message)
  }) as typeof i18n.mergeLocaleMessage

  i18n.setLocaleMessage = ((locale: string, message: object) => {
    byRef.delete(locale)
    set(locale, message)
  }) as typeof i18n.setLocaleMessage

  return (locale: string, message: object) => {
    // a second install has no small tree left to fill from - the first one is already in place
    if (byRef.has(locale)) {
      i18n.mergeLocaleMessage(locale, message)
      return
    }
    // whatever is present before anything is loaded comes from the vue-i18n config, and filling it
    // in underneath keeps the loaded tree shared instead of deep copying it into the config's
    set(locale, fillMissing(message, i18n.getLocaleMessage(locale)))
    byRef.add(locale)
  }
}

export function createNuxtI18nContext(nuxt: NuxtApp, vueI18n: I18n, defaultLocale: string): NuxtI18nContext {
  const i18n = getI18nTarget(vueI18n)
  const installMessages = import.meta.server ? createMessageInstaller(getComposer(vueI18n)) : undefined
  const runtimeI18n = useRuntimeI18n(nuxt)
  const detectConfig = useI18nDetection(nuxt)
  const serverLocaleConfigs = useLocaleConfigs()
  const localeCookie = useI18nCookie(detectConfig)
  const loadMap = new Set<string>()

  /** Get computed config for locale */
  const getLocaleConfig = (locale: string) => serverLocaleConfigs.value![locale]
  const getDomainFromLocale = (locale: string) =>
    domainFromLocale(runtimeI18n.domainLocales, useRequestURL({ xForwardedHost: true }), locale)
  if (import.meta.dev && isFunction(runtimeI18n.baseUrl)) {
    console.warn('[nuxt-i18n] Configuring baseUrl as a function is deprecated and will be removed in v11.')
  }
  const getBaseUrl = createBaseUrlGetter({
    baseUrl: isFunction(runtimeI18n.baseUrl) ? () => (runtimeI18n.baseUrl as BaseUrlResolveHandler<unknown>)(nuxt) : runtimeI18n.baseUrl,
    appBase: nuxt.$config.app.baseURL,
    domains: __I18N_DOMAINS__,
    defaultLocale,
    getDomainFromLocale,
  })
  const resolvedLocale = useResolvedLocale()
  if (__I18N_SERVER_REDIRECT__ && import.meta.server && nuxt.ssrContext?.event?.context?.nuxtI18n?.detectLocale) {
    resolvedLocale.value = nuxt.ssrContext.event.context.nuxtI18n.detectLocale
  }

  // there is no endpoint to read from without a server, and a statically hosted build only ends
  // up with the messages that were prerendered - both need the loaders. Anything the build can
  // resolve to serializable content is served from the endpoint instead, decided per locale.
  const buildUsesRuntimeLoaders = (locale: string) =>
    !__IS_SSR__
    || __I18N_UNSERIALIZABLE_LOCALES__.includes(locale)
    || (__I18N_DYNAMIC_LOCALES__.includes(locale) && (import.meta.prerender || __IS_SSG__))

  const loadMessagesFromLoaders = async (locale: string) => {
    const msg = await nuxt.runWithContext(() => getLocaleMessagesMergedCached(locale, localeLoaders[locale]))
    // dev always loads from loaders - warn when production would deliver this locale as JSON instead
    if (import.meta.dev && !buildUsesRuntimeLoaders(locale)) {
      warnMissedMessageFunctions(locale, msg)
    }
    i18n.mergeLocaleMessage(locale, msg)
  }

  const loadMessagesFromServer = async (locale: string) => {
    if (locale in localeLoaders === false) { return }

    // a response can embed fallback locales that belong to runtime loaders - merging those would
    // overwrite the loader-produced messages with a (possibly prerendered) build-time snapshot
    const deliverable = (messages: LocaleMessages<DefineLocaleMessage>) =>
      Object.keys(messages).filter(k => !ctx.usesRuntimeLoaders(k))

    // during SSR the messages endpoint runs in this same process - `$fetch` would serialize the
    // whole message tree to JSON and parse it back on every request
    const serverCtx = import.meta.server ? nuxt.ssrContext?.event?.context?.nuxtI18n : undefined
    if (serverCtx?.loadMessages && installMessages) {
      const messages = await serverCtx.loadMessages(locale)
      for (const k of deliverable(messages)) {
        installMessages(k, messages[k]!)
      }
      return
    }

    const headers: HeadersInit = getLocaleConfig(locale)?.cacheable ? {} : { 'Cache-Control': 'no-cache' }
    // Client fetches from `app.cdnURL` when messages are prerendered as static assets;
    // SSR uses a relative URL so it doesn't round-trip through the CDN.
    const prefix = import.meta.client && __I18N_CDN__ ? (nuxt.$config.app.cdnURL || '') : ''
    const url = joinURL(prefix, __I18N_SERVER_ROUTE__, __I18N_LOCALE_HASHES__[locale]!, locale, 'messages.json')
    const messages = await $fetch<LocaleMessages<DefineLocaleMessage>>(url, { headers })
    for (const k of deliverable(messages)) {
      i18n.mergeLocaleMessage(k, messages[k])
    }
  }

  const ctx: NuxtI18nContext = {
    vueI18n,
    initial: true,
    preloaded: false,
    config: runtimeI18n,
    rootRedirect: resolveRootRedirect(runtimeI18n.rootRedirect),
    redirectStatusCode: runtimeI18n.redirectStatusCode ?? 302,
    // dev is forced onto the loaders regardless of the build's decision, so that edits to locale
    // files take effect
    usesRuntimeLoaders: locale => import.meta.dev || buildUsesRuntimeLoaders(locale),
    getDefaultLocale: () => defaultLocale,
    getLocale: () => unref(i18n.locale),
    setLocale: async (locale: string) => {
      const oldLocale = ctx.getLocale()
      if (locale === oldLocale || !isSupportedLocale(locale)) { return }

      if (isRef(i18n.locale)) {
        i18n.locale.value = locale
      } else {
        i18n.locale = locale
      }

      await nuxt.callHook('i18n:localeSwitched', { newLocale: locale, oldLocale })

      resolvedLocale.value = locale
    },
    setLocaleSuspend: async (locale: string) => {
      if (!isSupportedLocale(locale)) { return }

      ctx.vueI18n.__pendingLocale = locale
      ctx.vueI18n.__pendingLocalePromise = new Promise((resolve) => {
        ctx.vueI18n.__resolvePendingLocalePromise = async () => {
          // TODO: always syncing cookie may be undesirable, consider making this configurable
          ctx.setCookieLocale(locale)
          await ctx.setLocale(locale)
          ctx.vueI18n.__pendingLocale = undefined
          resolve()
        }
      })

      if (import.meta.server || nuxt.isHydrating || !ctx.config.skipSettingLocaleOnNavigate) {
        await ctx.vueI18n.__resolvePendingLocalePromise?.()
      }
    },
    // string locales carry no domain configuration, they normalize to the empty form
    getLocales: () =>
      unref(i18n.locales).map(x =>
        isString(x) ? { code: x, domains: [], defaultForDomains: [] } : (x as NormalizedLocaleObject<string>),
      ),
    setCookieLocale: (locale: string) => {
      if (detectConfig.useCookie && isSupportedLocale(locale)) {
        localeCookie.value = locale
      }
    },
    getBaseUrl,
    loadMessages: async (locale: string) => {
      // prevent multiple loads during hydration
      if (nuxt.isHydrating && loadMap.has(locale)) { return }

      try {
        const fallbacks = getLocaleConfig(locale)?.fallbacks ?? []
        const chain = fallbacks.includes(locale) ? fallbacks : [...fallbacks, locale]
        // the endpoint merges a locale with its fallbacks, so one request covers a chain of them
        if (!chain.some(x => ctx.usesRuntimeLoaders(x))) {
          return await loadMessagesFromServer(locale)
        }
        // a static fallback of a dynamic locale has no loaders left to run, so each locale in the
        // chain is loaded through whichever source holds its messages - a failing fallback should
        // not keep the rest of the chain from loading
        for (const k of chain) {
          try {
            await (ctx.usesRuntimeLoaders(k) ? loadMessagesFromLoaders(k) : loadMessagesFromServer(k))
          } catch (e) {
            console.warn(`Failed to load messages for locale "${k}"`, e)
          }
        }
      } catch (e) {
        console.warn(`Failed to load messages for locale "${locale}"`, e)
      } finally {
        loadMap.add(locale)
      }
    },
    composableCtx: undefined!,
  }
  ctx.composableCtx = createComposableContext(ctx, nuxt)
  return ctx
}

export function useNuxtI18nContext(nuxt: NuxtApp) {
  if (nuxt._nuxtI18n == null) {
    throw new Error('Nuxt I18n context has not been set up yet.')
  }
  return nuxt._nuxtI18n
}
