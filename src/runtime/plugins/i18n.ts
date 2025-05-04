import { computed, isRef, ref, unref, watch } from 'vue'
import { createI18n, type LocaleMessages, type DefineLocaleMessage } from 'vue-i18n'

import { defineNuxtPlugin, prerenderRoutes, useNuxtApp, useState } from '#imports'
import { localeCodes, vueI18nConfigs, normalizedLocales, localeLoaders } from '#build/i18n.options.mjs'
import { getLocaleMessagesMergedCached, loadVueI18nOptions } from '../messages'
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

import type { Locale, I18nOptions, Composer } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { LocaleObject, I18nPublicRuntimeConfig, I18nHeadOptions } from '#internal-i18n-types'

const useLocaleConfigs = () =>
  useState<Record<string, { cacheable: boolean; fallbacks: string[] }>>('i18n:cached-locale-configs', () => ({}))

export default defineNuxtPlugin({
  name: 'i18n:plugin',
  parallel: __PARALLEL_PLUGIN__,
  async setup(_nuxt) {
    Object.defineProperty(_nuxt.versions, 'nuxtI18n', { get: () => __NUXT_I18N_VERSION__ })

    const logger = /*#__PURE__*/ createLogger('plugin:i18n')
    const nuxt = useNuxtApp()
    const serverLocaleConfigs = useLocaleConfigs()
    const _runtimeI18n = nuxt.$config.public.i18n as I18nPublicRuntimeConfig
    nuxt._i18nGetDomainFromLocale = createDomainFromLocaleGetter(nuxt)

    let defaultLocaleDomain: string = _runtimeI18n.defaultLocale || ''
    if (__MULTI_DOMAIN_LOCALES__) {
      defaultLocaleDomain = getDefaultLocaleForDomain(_runtimeI18n)
      setupMultiDomainLocales(defaultLocaleDomain)
    }

    nuxt.$config.public.i18n.defaultLocale = defaultLocaleDomain

    // Fresh copy per request to prevent reusing mutated options
    const runtimeI18n = {
      ..._runtimeI18n,
      defaultLocale: defaultLocaleDomain,
      baseUrl: createBaseUrlGetter(nuxt)
    }

    __DEBUG__ && logger.log('defaultLocale on setup', runtimeI18n.defaultLocale)

    const vueI18nOptions: I18nOptions = await loadVueI18nOptions(vueI18nConfigs)
    if (defaultLocaleDomain) {
      vueI18nOptions.locale = defaultLocaleDomain
    }

    // initialize locale objects to make vue-i18n aware of available locales
    for (const l of localeCodes) {
      vueI18nOptions.messages![l] ??= {}
    }

    let preloadedMessages: LocaleMessages<DefineLocaleMessage> | undefined
    const dynamicResourcesSSG = !__I18N_FULL_STATIC__ && (import.meta.prerender || __IS_SSG__)
    // retrieve loaded messages from server-side if enabled
    if (import.meta.server) {
      const serverI18n = nuxt.ssrContext!.event.context.nuxtI18n
      if (serverI18n?.localeConfigs) {
        serverLocaleConfigs.value = serverI18n.localeConfigs
      }
      if (serverI18n?.messages && Object.keys(serverI18n.messages).length) {
        preloadedMessages = serverI18n.messages
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
      __DEBUG__ && logger.log('preloaded full static messages', nuxt._i18nPreloaded)
      for (const locale of localeCodes) {
        if (preloadedMessages[locale]) {
          deepCopy(preloadedMessages[locale], vueI18nOptions.messages![locale])
        }
      }
      nuxt._i18nPreloaded = true
    }

    nuxt._i18nLoadAndSetMessages = async (locale: string) => {
      if (dynamicResourcesSSG || import.meta.dev) {
        const locales = serverLocaleConfigs.value?.[locale]?.fallbacks ?? []
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
      if (!serverLocaleConfigs.value?.[locale]?.cacheable) {
        headers.set('Cache-Control', 'no-cache')
      }

      const messages = await $fetch(`/_i18n/${locale}/messages.json`, { headers })
      for (const locale of Object.keys(messages)) {
        nuxt.$i18n.mergeLocaleMessage(locale, messages[locale])
      }
    }

    prerenderRoutes(localeCodes.map(locale => `/_i18n/${locale}/messages.json`))

    // create i18n instance
    const i18n = createI18n(vueI18nOptions)

    if (__I18N_STRIP_UNUSED__ && import.meta.server) {
      const serverI18n = nuxt.ssrContext!.event.context.nuxtI18n
      if (serverI18n) {
        const target = i18n.global

        const originalT = target.t.bind(target)
        // @ts-expect-error type mismatch
        target.t = (key, _, opts) => {
          // @ts-expect-error type mismatch
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          serverI18n.trackKey(key, opts?.locale ?? unref(target.locale))
          return originalT(key, _ as Parameters<typeof originalT>[1], opts as Parameters<typeof originalT>[2])
        }

        const originalTe = target.te.bind(target)
        target.te = (key, locale) => {
          serverI18n.trackKey(key, locale || unref(target.locale))
          return originalTe(key, locale)
        }

        const originalTm = target.tm.bind(target)
        target.tm = key => {
          serverI18n.trackKey(key, unref(target.locale))
          return originalTm(key)
        }
      }
    }

    nuxt._vueI18n = i18n
    i18n.__localeFromRoute = createLocaleFromRouteGetter({
      separator: __ROUTE_NAME_SEPARATOR__,
      defaultSuffix: __ROUTE_NAME_DEFAULT_SUFFIX__,
      localeCodes
    })
    i18n.__firstAccess = true
    i18n.__setLocale = (locale: string) => {
      const i = getI18nTarget(i18n)
      if (isRef(i.locale)) {
        i.locale.value = locale
      } else {
        i.locale = locale
      }
    }
    nuxt._nuxtI18n = createComposableContext({ i18n, getDomainFromLocale: nuxt._i18nGetDomainFromLocale, runtimeI18n })

    // HMR helper functionality
    if (import.meta.dev) {
      nuxt._nuxtI18nDev = createNuxtI18nDev()
    }

    const localeCookie = createI18nCookie()
    const detectBrowserOptions = runtimeI18n.detectBrowserLanguage
    // extend i18n instance
    extendI18n(i18n, {
      extendComposer(composer) {
        const _locales = ref<Locale[] | LocaleObject[]>(runtimeI18n.locales)
        composer.locales = computed(() => _locales.value)

        const _localeCodes = ref<Locale[]>(localeCodes)
        composer.localeCodes = computed(() => _localeCodes.value)

        const _baseUrl = ref(runtimeI18n.baseUrl())
        composer.baseUrl = computed(() => _baseUrl.value)

        if (import.meta.client) {
          watch(composer.locale, () => (_baseUrl.value = runtimeI18n.baseUrl()))
        }

        composer.strategy = __I18N_STRATEGY__
        composer.localeProperties = computed(
          () => normalizedLocales.find(l => l.code === composer.locale.value) || { code: composer.locale.value }
        )
        composer.setLocale = async (locale: string) => {
          await loadAndSetLocale(locale, i18n.__firstAccess)

          if (__I18N_STRATEGY__ === 'no_prefix' || !__HAS_PAGES__) {
            // first access will not change without route middleware
            i18n.__firstAccess = false
            i18n.__setLocale(locale)
            return
          }

          const route = nuxt.$router.currentRoute.value
          const redirectPath = await nuxt.runWithContext(() =>
            detectRedirect({ to: route, locale, routeLocale: i18n.__localeFromRoute(route) })
          )

          __DEBUG__ && logger.log('redirectPath on setLocale', redirectPath)

          await nuxt.runWithContext(() => navigate({ nuxt, redirectPath, locale, route }, true))
        }
        composer.loadLocaleMessages = async (locale: string) => await nuxt._i18nLoadAndSetMessages(locale)

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

          i18n.__setLocale(i18n.__pendingLocale)
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
