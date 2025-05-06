import { computed, isRef, ref, watch } from 'vue'
import { createI18n, type LocaleMessages, type DefineLocaleMessage } from 'vue-i18n'

import { defineNuxtPlugin, prerenderRoutes, useNuxtApp, useState } from '#imports'
import { localeCodes, normalizedLocales, localeLoaders } from '#build/i18n.options.mjs'
import { getLocaleMessagesMergedCached } from '../shared/messages'
import {
  loadAndSetLocale,
  detectRedirect,
  navigate,
  createBaseUrlGetter,
  createNuxtI18nDev,
  createComposableContext
} from '../utils'
import { getLocaleCookie, createI18nCookie, getBrowserLocale } from '../internal'
import { createLocaleFromRouteGetter } from '#i18n-kit/routing'
import { extendI18n } from '../routing/i18n'
import { createLogger } from '#nuxt-i18n/logger'
import { getI18nTarget } from '../compatibility'
import { localeHead } from '../routing/head'
import { useLocalePath, useLocaleRoute, useRouteBaseName, useSwitchLocalePath } from '../composables'
import { createDomainFromLocaleGetter, getDefaultLocaleForDomain, setupMultiDomainLocales } from '../domain'
import { parse } from 'devalue'
import { deepCopy } from '@intlify/shared'
import { setupVueI18nOptions } from '../shared/vue-i18n'

import type { Locale, I18nOptions, Composer, TranslateOptions } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { LocaleObject, I18nPublicRuntimeConfig, I18nHeadOptions } from '#internal-i18n-types'
import type { CompatRoute } from '../types'

const dynamicResourcesSSG = !__I18N_FULL_STATIC__ && (import.meta.prerender || __IS_SSG__)
const useLocaleConfigs = () =>
  useState<Record<string, { cacheable: boolean; fallbacks: string[] }>>('i18n:cached-locale-configs', () => ({}))

function createNuxtI18nContext() {
  return {
    firstAccess: undefined! as boolean,
    preloaded: undefined! as boolean,
    setLocale: undefined! as (locale: string) => void,
    getLocaleFromRoute: undefined! as (route: string | CompatRoute) => string,
    getDomainFromLocale: undefined! as (locale: Locale) => string | undefined,
    getLocaleConfig: undefined! as (locale: Locale) => { cacheable: boolean; fallbacks: string[] } | undefined,
    loadLocaleMessages: undefined! as (locale: Locale) => Promise<void>
  }
}

export default defineNuxtPlugin({
  name: 'i18n:plugin',
  parallel: __PARALLEL_PLUGIN__,
  async setup(_nuxt) {
    Object.defineProperty(_nuxt.versions, 'nuxtI18n', { get: () => __NUXT_I18N_VERSION__ })

    const logger = /*#__PURE__*/ createLogger('plugin:i18n')
    const nuxt = useNuxtApp()
    nuxt._nuxtI18nCtx = createNuxtI18nContext()
    const ctx = nuxt._nuxtI18nCtx

    ctx.getDomainFromLocale = createDomainFromLocaleGetter(nuxt)
    const serverLocaleConfigs = useLocaleConfigs()
    ctx.getLocaleConfig = locale => serverLocaleConfigs.value[locale]

    const runtimeI18n = nuxt.$config.public.i18n as I18nPublicRuntimeConfig

    let defaultLocaleDomain: string = runtimeI18n.defaultLocale || ''
    if (__MULTI_DOMAIN_LOCALES__) {
      defaultLocaleDomain = getDefaultLocaleForDomain(runtimeI18n)
      setupMultiDomainLocales(defaultLocaleDomain)
    }

    runtimeI18n.defaultLocale = defaultLocaleDomain
    __DEBUG__ && logger.log('defaultLocale on setup', runtimeI18n.defaultLocale)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const vueI18nOptions: I18nOptions = nuxt.ssrContext?.event?.context?.vueI18n || (await setupVueI18nOptions())
    if (defaultLocaleDomain) {
      vueI18nOptions.locale = defaultLocaleDomain
    }

    // initialize locale objects to make vue-i18n aware of available locales
    for (const l of localeCodes) {
      vueI18nOptions.messages![l] ??= {}
    }

    let preloadedMessages: LocaleMessages<DefineLocaleMessage> | undefined
    // retrieve loaded messages from server-side if enabled
    if (import.meta.server) {
      const serverI18n = nuxt.ssrContext!.event.context.nuxtI18n
      if (serverI18n?.localeConfigs) {
        serverLocaleConfigs.value = serverI18n.localeConfigs
      }
      if (serverI18n?.messages && Object.keys(serverI18n.messages).length) {
        vueI18nOptions.messages = serverI18n.messages
        ctx.preloaded = true
      }
    }

    if (import.meta.client) {
      const content = document.querySelector(`[data-nuxt-i18n="${nuxt._id}"]`)?.textContent
      if (content) {
        preloadedMessages = parse(content) as LocaleMessages<DefineLocaleMessage> | undefined
      }
      if (preloadedMessages && Object.keys(preloadedMessages).length && dynamicResourcesSSG) {
        try {
          const msg = await Promise.all(
            Object.keys(preloadedMessages).map(async locale => ({
              [locale]: await getLocaleMessagesMergedCached(locale, localeLoaders[locale])
            }))
          )
          for (const m of msg) {
            deepCopy(m, preloadedMessages)
          }
        } catch (e) {
          console.log('Error loading messages', e)
        }
      }
    }

    if (preloadedMessages) {
      __DEBUG__ && logger.log('preloaded full static messages', ctx.preloaded)
      for (const locale of localeCodes) {
        if (preloadedMessages[locale]) {
          deepCopy(preloadedMessages[locale], vueI18nOptions.messages![locale])
        }
      }
      ctx.preloaded = true
    }

    ctx.loadLocaleMessages = async (locale: string) => {
      if (dynamicResourcesSSG || import.meta.dev) {
        const locales = ctx.getLocaleConfig(locale)?.fallbacks ?? []
        if (!locales.includes(locale)) {
          locales.push(locale)
        }
        for (const entry of locales) {
          nuxt.$i18n.mergeLocaleMessage(
            entry,
            await nuxt.runWithContext(() => getLocaleMessagesMergedCached(entry, localeLoaders[entry]))
          )
        }
        return
      }

      const headers = new Headers()
      if (!ctx.getLocaleConfig(locale)?.cacheable) {
        headers.set('Cache-Control', 'no-cache')
      }

      try {
        const messages = await $fetch(`/_i18n/${locale}/messages.json`, { headers })
        for (const locale of Object.keys(messages)) {
          nuxt.$i18n.mergeLocaleMessage(locale, messages[locale])
        }
      } catch (e) {
        console.warn('Failed to load messages for locale', locale, e)
      }
    }

    prerenderRoutes(localeCodes.map(locale => `/_i18n/${locale}/messages.json`))

    // create i18n instance
    const i18n = createI18n(vueI18nOptions)

    nuxt._vueI18n = i18n
    ctx.firstAccess = true
    ctx.getLocaleFromRoute = createLocaleFromRouteGetter({
      separator: __ROUTE_NAME_SEPARATOR__,
      defaultSuffix: __ROUTE_NAME_DEFAULT_SUFFIX__,
      localeCodes
    })
    ctx.setLocale = (locale: string) => {
      const i = getI18nTarget(i18n)
      if (isRef(i.locale)) {
        i.locale.value = locale
      } else {
        i.locale = locale
      }
    }

    nuxt._nuxtI18n = createComposableContext({ i18n, getDomainFromLocale: ctx.getDomainFromLocale, runtimeI18n })

    if (__I18N_STRIP_UNUSED__ && !__IS_SSG__) {
      const _ctx = nuxt._nuxtI18n
      if (import.meta.server) {
        const serverI18n = import.meta.server ? nuxt.ssrContext!.event.context.nuxtI18n : undefined
        const target = i18n.global

        const originalT = target.t.bind(target)
        type TParams = Parameters<typeof originalT>
        target.t = (
          key,
          listOrNamed?: string | number | unknown[] | Record<string, unknown>,
          opts?: TranslateOptions<string> | number | string
        ) => {
          const locale = ((typeof opts === 'object' && opts?.locale) || _ctx.getLocale()) as string
          serverI18n?.trackKey(key, locale)
          return originalT(key, listOrNamed as TParams[1], opts as TParams[2])
        }

        const originalTe = target.te.bind(target)
        target.te = (key, locale) => {
          serverI18n?.trackKey(key, locale || _ctx.getLocale())
          return originalTe(key, locale)
        }

        const originalTm = target.tm.bind(target)
        target.tm = key => {
          serverI18n?.trackKey(key, _ctx.getLocale())
          return originalTm(key)
        }
      }

      if (import.meta.client) {
        /**
         * Ensure messages are loaded before switching page for the first time
         */
        const unsub = nuxt.$router.beforeResolve(async (to, from) => {
          if (to.path === from.path) return
          await ctx.loadLocaleMessages(_ctx.getLocale())
          unsub()
        })
      }
    }

    // HMR helper functionality
    if (import.meta.dev) {
      nuxt._nuxtI18nDev = createNuxtI18nDev()
    }

    const baseUrl = createBaseUrlGetter(nuxt)
    const localeCookie = createI18nCookie()
    const detectBrowserOptions = runtimeI18n.detectBrowserLanguage
    // extend i18n instance
    extendI18n(i18n, {
      extendComposer(composer) {
        const _locales = ref<Locale[] | LocaleObject[]>(runtimeI18n.locales)
        composer.locales = computed(() => _locales.value)

        const _localeCodes = ref<Locale[]>(localeCodes)
        composer.localeCodes = computed(() => _localeCodes.value)

        const _baseUrl = ref(baseUrl())
        composer.baseUrl = computed(() => _baseUrl.value)

        if (import.meta.client) {
          watch(composer.locale, () => (_baseUrl.value = baseUrl()))
        }

        composer.strategy = __I18N_STRATEGY__
        composer.localeProperties = computed(
          () => normalizedLocales.find(l => l.code === composer.locale.value) || { code: composer.locale.value }
        )
        composer.setLocale = async (locale: string) => {
          await loadAndSetLocale(locale, ctx.firstAccess)

          if (__I18N_STRATEGY__ === 'no_prefix' || !__HAS_PAGES__) {
            // first access will not change without route middleware
            ctx.firstAccess = false
            ctx.setLocale(locale)
            return
          }

          const route = nuxt.$router.currentRoute.value
          const redirectPath = await nuxt.runWithContext(() =>
            detectRedirect({ to: route, locale, routeLocale: ctx.getLocaleFromRoute(route) })
          )

          __DEBUG__ && logger.log('redirectPath on setLocale', redirectPath)

          await nuxt.runWithContext(() => navigate({ nuxt, redirectPath, locale, route }, true))
        }
        composer.loadLocaleMessages = ctx.loadLocaleMessages

        composer.differentDomains = __DIFFERENT_DOMAINS__
        composer.defaultLocale = runtimeI18n.defaultLocale
        composer.getBrowserLocale = () => getBrowserLocale()
        composer.getLocaleCookie = () => getLocaleCookie(localeCookie, detectBrowserOptions, composer.defaultLocale)
        composer.setLocaleCookie = (locale: string) => {
          if (!detectBrowserOptions || !detectBrowserOptions.useCookie) return
          localeCookie.value = locale
        }

        composer.onBeforeLanguageSwitch = (oldLocale, newLocale, initialSetup, context) =>
          nuxt.callHook('i18n:beforeLocaleSwitch', {
            oldLocale,
            newLocale,
            initialSetup,
            context
          }) as Promise<Locale | void>
        composer.onLanguageSwitched = (oldLocale, newLocale) =>
          nuxt.callHook('i18n:localeSwitched', { oldLocale, newLocale }) as Promise<void>

        // eslint-disable-next-line @typescript-eslint/require-await --- TODO: breaking - signature should be synchronous
        composer.finalizePendingLocaleChange = async () => {
          if (!i18n.__pendingLocale) return

          ctx.setLocale(i18n.__pendingLocale)
          i18n.__resolvePendingLocalePromise?.()
          i18n.__pendingLocale = undefined
        }
        composer.waitForPendingLocaleChange = async () => {
          if (i18n.__pendingLocale && i18n.__pendingLocalePromise) {
            await i18n.__pendingLocalePromise
          }
        }
      },
      extendComposerInstance(instance, c) {
        // Set the extended properties on local scope composer instance
        const props: [keyof Composer, PropertyDescriptor['get']][] = [
          ['locales', () => c.locales],
          ['localeCodes', () => c.localeCodes],
          ['baseUrl', () => c.baseUrl],
          ['strategy', () => __I18N_STRATEGY__],
          ['localeProperties', () => c.localeProperties],
          ['setLocale', () => async (locale: string) => Reflect.apply(c.setLocale, c, [locale])],
          ['loadLocaleMessages', () => async (locale: string) => Reflect.apply(c.loadLocaleMessages, c, [locale])],
          ['differentDomains', () => __DIFFERENT_DOMAINS__],
          ['defaultLocale', () => c.defaultLocale],
          ['getBrowserLocale', () => () => Reflect.apply(c.getBrowserLocale, c, [])],
          ['getLocaleCookie', () => () => Reflect.apply(c.getLocaleCookie, c, [])],
          ['setLocaleCookie', () => (locale: string) => Reflect.apply(c.setLocaleCookie, c, [locale])],
          [
            'onBeforeLanguageSwitch',
            () => (oldLocale: string, newLocale: string, initialSetup: boolean, context: NuxtApp) =>
              Reflect.apply(c.onBeforeLanguageSwitch, c, [oldLocale, newLocale, initialSetup, context])
          ],
          [
            'onLanguageSwitched',
            () => (oldLocale: string, newLocale: string) =>
              Reflect.apply(c.onLanguageSwitched, c, [oldLocale, newLocale])
          ],
          ['finalizePendingLocaleChange', () => () => Reflect.apply(c.finalizePendingLocaleChange, c, [])],
          ['waitForPendingLocaleChange', () => () => Reflect.apply(c.waitForPendingLocaleChange, c, [])]
        ]

        for (const [key, get] of props) {
          Object.defineProperty(instance, key, { get })
        }
      }
    })

    nuxt.vueApp.use(i18n)

    /**
     * We inject `i18n.global` to **nuxt app instance only** as vue-i18n has already been injected into vue
     * from https://github.com/nuxt/nuxt/blob/a995f724eadaa06d5443b188879ac18dfe73de2e/packages/nuxt/src/app/nuxt.ts#L295-L299
     */
    Object.defineProperty(nuxt, '$i18n', { get: () => getI18nTarget(i18n) })

    nuxt.provide('localeHead', (options: I18nHeadOptions) => localeHead(nuxt._nuxtI18n, options))
    nuxt.provide('localePath', useLocalePath())
    nuxt.provide('localeRoute', useLocaleRoute())
    nuxt.provide('routeBaseName', useRouteBaseName())
    nuxt.provide('getRouteBaseName', useRouteBaseName())
    nuxt.provide('switchLocalePath', useSwitchLocalePath())
  }
})
