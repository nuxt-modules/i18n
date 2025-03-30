import { computed, isRef, ref, watch } from 'vue'
import { createI18n } from 'vue-i18n'
import { defineNuxtPlugin, useNuxtApp } from '#imports'
import {
  localeCodes,
  vueI18nConfigs,
  hasPages,
  localeLoaders,
  parallelPlugin,
  normalizedLocales
} from '#build/i18n.options.mjs'
import { loadVueI18nOptions, loadLocale } from '../messages'
import { loadAndSetLocale, detectRedirect, navigate, extendBaseUrl, createNuxtI18nDev } from '../utils'
import {
  getLocaleCookie,
  createI18nCookie,
  runtimeDetectBrowserLanguage,
  wrapComposable,
  getBrowserLocale
} from '../internal'
import { createLocaleFromRouteGetter } from '../routing/utils'
import { extendI18n } from '../routing/i18n'
import { createLogger } from '#nuxt-i18n/logger'
import { getI18nTarget } from '../compatibility'
import { resolveRoute } from '../routing/routing'
import { localeHead } from '../routing/head'
import { useLocalePath, useLocaleRoute, useRouteBaseName, useSwitchLocalePath, useLocaleLocation } from '../composables'
import { getDefaultLocaleForDomain, setupMultiDomainLocales } from '../domain'

import type { Locale, I18nOptions, Composer } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { LocaleObject, I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { LocaleHeadFunction, ResolveRouteFunction } from '../composables'

export default defineNuxtPlugin({
  name: 'i18n:plugin',
  parallel: parallelPlugin,
  async setup() {
    const logger = /*#__PURE__*/ createLogger('plugin:i18n')
    const nuxt = useNuxtApp()
    const _runtimeI18n = nuxt.$config.public.i18n as I18nPublicRuntimeConfig

    const defaultLocaleDomain = getDefaultLocaleForDomain(_runtimeI18n)
    setupMultiDomainLocales(_runtimeI18n, defaultLocaleDomain)
    nuxt.$config.public.i18n.defaultLocale = defaultLocaleDomain

    // Fresh copy per request to prevent reusing mutated options
    const runtimeI18n = {
      ..._runtimeI18n,
      defaultLocale: defaultLocaleDomain,
      baseUrl: extendBaseUrl(nuxt)
    }

    __DEBUG__ && logger.log('defaultLocale on setup', runtimeI18n.defaultLocale)

    const vueI18nOptions: I18nOptions = await loadVueI18nOptions(vueI18nConfigs, useNuxtApp())
    vueI18nOptions.messages ||= {}
    vueI18nOptions.fallbackLocale ??= false
    if (defaultLocaleDomain) {
      vueI18nOptions.locale = defaultLocaleDomain
    }

    // initialize locale objects to make vue-i18n aware of available locales
    for (const l of localeCodes) {
      vueI18nOptions.messages[l] ??= {}
    }

    // create i18n instance
    const i18n = createI18n(vueI18nOptions)

    nuxt._vueI18n = i18n
    i18n.__localeFromRoute = createLocaleFromRouteGetter()
    i18n.__firstAccess = true
    i18n.__setLocale = (locale: string) => {
      const i = getI18nTarget(i18n)
      if (isRef(i.locale)) {
        i.locale.value = locale
      } else {
        i.locale = locale
      }
    }

    // HMR helper functionality
    if (import.meta.dev) {
      nuxt._nuxtI18nDev = createNuxtI18nDev()
    }

    const localeCookie = createI18nCookie()
    const detectBrowserOptions = runtimeDetectBrowserLanguage()
    // extend i18n instance
    extendI18n(i18n, {
      extendComposer(composer) {
        const _locales = ref<Locale[] | LocaleObject[]>(runtimeI18n.locales)
        composer.locales = computed(() => _locales.value as unknown as typeof composer.locales.value)

        const _localeCodes = ref<Locale[]>(localeCodes)
        composer.localeCodes = computed(() => _localeCodes.value)

        const _baseUrl = ref(runtimeI18n.baseUrl())
        composer.baseUrl = computed(() => _baseUrl.value)

        if (import.meta.client) {
          watch(composer.locale, () => (_baseUrl.value = runtimeI18n.baseUrl()))
        }

        composer.strategy = runtimeI18n.strategy
        composer.localeProperties = computed(
          () => normalizedLocales.find(l => l.code === composer.locale.value) || { code: composer.locale.value }
        )
        composer.setLocale = async (locale: string) => {
          await loadAndSetLocale(locale, i18n.__firstAccess)

          if (composer.strategy === 'no_prefix' || !hasPages) {
            await composer.loadLocaleMessages(locale)
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
        composer.loadLocaleMessages = async (locale: string) =>
          await loadLocale(locale, localeLoaders, composer.mergeLocaleMessage.bind(composer), nuxt)
        composer.differentDomains = runtimeI18n.differentDomains
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
          ['strategy', () => c.strategy],
          ['localeProperties', () => c.localeProperties],
          ['setLocale', () => async (locale: string) => Reflect.apply(c.setLocale, c, [locale])],
          ['loadLocaleMessages', () => async (locale: string) => Reflect.apply(c.loadLocaleMessages, c, [locale])],
          ['differentDomains', () => c.differentDomains],
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

    return {
      provide: {
        /**
         * TODO: remove type assertions while type narrowing based on generated types
         */
        localeHead: wrapComposable(localeHead) as LocaleHeadFunction,
        localePath: useLocalePath(),
        localeRoute: useLocaleRoute(),
        getRouteBaseName: useRouteBaseName(),
        switchLocalePath: useSwitchLocalePath(),
        // TODO: remove in v10
        resolveRoute: wrapComposable(resolveRoute) as ResolveRouteFunction,
        // TODO: remove in v10
        localeLocation: useLocaleLocation()
      }
    }
  }
})
