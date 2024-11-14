import { computed, ref, watch } from 'vue'
import { createI18n } from 'vue-i18n'
import { defineNuxtPlugin, useRoute, addRouteMiddleware, defineNuxtRouteMiddleware, useNuxtApp } from '#imports'
import {
  localeCodes,
  vueI18nConfigs,
  isSSG,
  localeLoaders,
  parallelPlugin,
  normalizedLocales
} from '#build/i18n.options.mjs'
import { loadVueI18nOptions, loadInitialMessages, loadLocale } from '../messages'
import { loadAndSetLocale, detectLocale, detectRedirect, navigate, injectNuxtHelpers, extendBaseUrl } from '../utils'
import {
  getBrowserLocale,
  getLocaleCookie,
  setLocaleCookie,
  detectBrowserLanguage,
  getI18nCookie,
  runtimeDetectBrowserLanguage,
  getDefaultLocaleForDomain,
  setupMultiDomainLocales
} from '../internal'
import { inBrowser, resolveBaseUrl } from '../routing/utils'
import { extendI18n } from '../routing/extends/i18n'
import { createLocaleFromRouteGetter } from '../routing/extends/router'
import { setLocale, getLocale, mergeLocaleMessage, setLocaleProperty } from '../compatibility'
import { createLogger } from 'virtual:nuxt-i18n-logger'

import type { NuxtI18nPluginInjections } from '../injections'
import type { Locale, I18nOptions } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { LocaleObject } from '#i18n-shared-types'
import type { I18nPublicRuntimeConfig } from '#i18n-shared-types'

// from https://github.com/nuxt/nuxt/blob/2466af53b0331cdb8b17c2c3b08675c5985deaf3/packages/nuxt/src/core/templates.ts#L152
type Decorate<T extends Record<string, unknown>> = { [K in keyof T as K extends string ? `$${K}` : never]: T[K] }

// TODO: use @nuxt/module-builder to stub/prepare types
declare module '#app' {
  interface NuxtApp extends Decorate<NuxtI18nPluginInjections> {}
}

// declare module 'vue' {
//   interface ComponentCustomProperties extends Decorate<NuxtI18nPluginInjections> {}
// }

// `NuxtI18nPluginInjections` should not have properties prefixed with `$`
export default defineNuxtPlugin<NuxtI18nPluginInjections>({
  name: 'i18n:plugin',
  parallel: parallelPlugin,
  async setup(nuxt) {
    const logger = /*#__PURE__*/ createLogger('plugin:i18n')
    const route = useRoute()
    const { vueApp: app } = nuxt
    const nuxtContext = nuxt as unknown as NuxtApp

    const defaultLocaleDomain = getDefaultLocaleForDomain(nuxtContext)
    setupMultiDomainLocales(nuxtContext, defaultLocaleDomain)

    // Fresh copy per request to prevent reusing mutated options
    const runtimeI18n = {
      ...(nuxtContext.$config.public.i18n as I18nPublicRuntimeConfig),
      defaultLocale: defaultLocaleDomain
    }
    // @ts-expect-error type incompatible
    runtimeI18n.baseUrl = extendBaseUrl()

    const _detectBrowserLanguage = runtimeDetectBrowserLanguage()

    __DEBUG__ && logger.log('isSSG', isSSG)
    __DEBUG__ && logger.log('useCookie on setup', _detectBrowserLanguage && _detectBrowserLanguage.useCookie)
    __DEBUG__ && logger.log('defaultLocale on setup', runtimeI18n.defaultLocale)

    const vueI18nOptions: I18nOptions = await loadVueI18nOptions(vueI18nConfigs, useNuxtApp())
    vueI18nOptions.messages = vueI18nOptions.messages || {}
    vueI18nOptions.fallbackLocale = vueI18nOptions.fallbackLocale ?? false

    const getLocaleFromRoute = createLocaleFromRouteGetter()
    const getDefaultLocale = (locale: string) => locale || vueI18nOptions.locale || 'en-US'

    const localeCookie = getI18nCookie()
    // detect initial locale
    let initialLocale = detectLocale(
      route,
      getLocaleFromRoute(route),
      getDefaultLocale(runtimeI18n.defaultLocale),
      {
        ssg: isSSG && runtimeI18n.strategy === 'no_prefix' ? 'ssg_ignore' : 'normal',
        callType: 'setup',
        firstAccess: true,
        localeCookie: getLocaleCookie(localeCookie, _detectBrowserLanguage, runtimeI18n.defaultLocale)
      },
      runtimeI18n
    )
    __DEBUG__ && logger.log('first detect initial locale', initialLocale)

    // load initial vue-i18n locale messages
    vueI18nOptions.messages = await loadInitialMessages(vueI18nOptions.messages, localeLoaders, {
      localeCodes,
      initialLocale,
      lazy: runtimeI18n.lazy,
      defaultLocale: runtimeI18n.defaultLocale,
      fallbackLocale: vueI18nOptions.fallbackLocale
    })

    /**
     * NOTE:
     *  If `initialLocale` is not set, then the `vueI18n` option `locale` is respect!
     *  It means a mode that works only with simple vue-i18n, without nuxtjs/i18n routing, browser detection, SEO, and other features.
     */
    initialLocale = getDefaultLocale(initialLocale)
    __DEBUG__ && logger.log('final initial locale:', initialLocale)

    // create i18n instance
    const i18n = createI18n({ ...vueI18nOptions, locale: initialLocale })

    let notInitialSetup = true
    const isInitialLocaleSetup = (locale: Locale) => initialLocale !== locale && notInitialSetup

    let ssgModeInitialSetup = true
    const isSSGModeInitialSetup = () => isSSG && ssgModeInitialSetup

    /**
     * NOTE:
     *  avoid hydration mismatch for SSG mode
     */
    if (isSSGModeInitialSetup() && runtimeI18n.strategy === 'no_prefix' && import.meta.client) {
      const initialLocaleCookie = localeCookie.value
      nuxt.hook('app:mounted', async () => {
        __DEBUG__ && logger.log('hook app:mounted')
        const detected = detectBrowserLanguage(
          route,
          {
            ssg: 'ssg_setup',
            callType: 'setup',
            firstAccess: true,
            localeCookie: initialLocaleCookie
          },
          initialLocale
        )
        __DEBUG__ && logger.log('app:mounted: detectBrowserLanguage (locale, reason, from) -', Object.values(detected))
        await setLocale(i18n, detected.locale)
        ssgModeInitialSetup = false
      })
    }

    // extend i18n instance
    extendI18n(i18n, {
      extendComposer(composer) {
        const route = useRoute()
        const _locales = ref<Locale[] | LocaleObject[]>(runtimeI18n.locales)
        const _localeCodes = ref<Locale[]>(localeCodes)
        const _baseUrl = ref<string>('')

        // @ts-expect-error type mismatch
        composer.locales = computed(() => _locales.value)
        composer.localeCodes = computed(() => _localeCodes.value)
        composer.baseUrl = computed(() => _baseUrl.value)

        if (inBrowser) {
          watch(
            composer.locale,
            () => {
              _baseUrl.value = resolveBaseUrl(runtimeI18n.baseUrl!, nuxtContext)
            },
            { immediate: true }
          )
        } else {
          _baseUrl.value = resolveBaseUrl(runtimeI18n.baseUrl!, nuxtContext)
        }

        composer.strategy = runtimeI18n.strategy
        composer.localeProperties = computed(
          () => normalizedLocales.find(l => l.code === composer.locale.value) || { code: composer.locale.value }
        )
        composer.setLocale = async (locale: string) => {
          const localeSetup = isInitialLocaleSetup(locale)
          const modified = await loadAndSetLocale(locale, i18n, runtimeI18n, localeSetup)

          if (modified && localeSetup) {
            notInitialSetup = false
          }

          const redirectPath = await nuxtContext.runWithContext(() =>
            detectRedirect({
              route: { to: route },
              locale,
              routeLocale: getLocaleFromRoute(route),
              strategy: runtimeI18n.strategy
            })
          )
          __DEBUG__ && logger.log('redirectPath on setLocale', redirectPath)

          await nuxtContext.runWithContext(
            async () =>
              await navigate(
                {
                  nuxtApp: nuxtContext,
                  i18n,
                  redirectPath,
                  locale,
                  route
                },
                { enableNavigate: true }
              )
          )
        }
        composer.loadLocaleMessages = async (locale: string) => {
          const setter = mergeLocaleMessage.bind(null, i18n)
          await loadLocale(locale, localeLoaders, setter)
        }
        composer.differentDomains = runtimeI18n.differentDomains
        composer.defaultLocale = runtimeI18n.defaultLocale
        composer.getBrowserLocale = () => getBrowserLocale()
        composer.getLocaleCookie = () =>
          getLocaleCookie(localeCookie, _detectBrowserLanguage, runtimeI18n.defaultLocale)
        composer.setLocaleCookie = (locale: string) => setLocaleCookie(localeCookie, locale, _detectBrowserLanguage)

        composer.onBeforeLanguageSwitch = (oldLocale, newLocale, initialSetup, context) =>
          nuxt.callHook('i18n:beforeLocaleSwitch', {
            oldLocale,
            newLocale,
            initialSetup,
            context
          }) as Promise<Locale | void>
        composer.onLanguageSwitched = (oldLocale, newLocale) =>
          nuxt.callHook('i18n:localeSwitched', { oldLocale, newLocale }) as Promise<void>

        composer.finalizePendingLocaleChange = async () => {
          if (!i18n.__pendingLocale) {
            return
          }
          setLocaleProperty(i18n, i18n.__pendingLocale)
          if (i18n.__resolvePendingLocalePromise) {
            // eslint-disable-next-line @typescript-eslint/await-thenable -- FIXME: `__resolvePendingLocalePromise` should be `Promise<void>`
            await i18n.__resolvePendingLocalePromise()
          }
          i18n.__pendingLocale = undefined
        }
        composer.waitForPendingLocaleChange = async () => {
          if (i18n.__pendingLocale && i18n.__pendingLocalePromise) {
            await i18n.__pendingLocalePromise
          }
        }
      },
      extendComposerInstance(instance, c) {
        type ExtendPropertyDescriptors = { [key: string]: Pick<PropertyDescriptor, 'get'> }

        const properties: ExtendPropertyDescriptors = {
          locales: {
            get: () => c.locales.value
          },
          localeCodes: {
            get: () => c.localeCodes.value
          },
          baseUrl: {
            get: () => c.baseUrl.value
          },
          strategy: {
            get: () => c.strategy
          },
          localeProperties: {
            get: () => c.localeProperties.value
          },
          setLocale: {
            get: () => async (locale: string) => Reflect.apply(c.setLocale, c, [locale])
          },
          loadLocaleMessages: {
            get: () => async (locale: string) => Reflect.apply(c.loadLocaleMessages, c, [locale])
          },
          differentDomains: {
            get: () => c.differentDomains
          },
          defaultLocale: {
            get: () => c.defaultLocale
          },
          getBrowserLocale: {
            get: () => () => Reflect.apply(c.getBrowserLocale, c, [])
          },
          getLocaleCookie: {
            get: () => () => Reflect.apply(c.getLocaleCookie, c, [])
          },
          setLocaleCookie: {
            get: () => (locale: string) => Reflect.apply(c.setLocaleCookie, c, [locale])
          },
          onBeforeLanguageSwitch: {
            get: () => (oldLocale: string, newLocale: string, initialSetup: boolean, context: NuxtApp) =>
              Reflect.apply(c.onBeforeLanguageSwitch, c, [oldLocale, newLocale, initialSetup, context])
          },
          onLanguageSwitched: {
            get: () => (oldLocale: string, newLocale: string) =>
              Reflect.apply(c.onLanguageSwitched, c, [oldLocale, newLocale])
          },
          finalizePendingLocaleChange: {
            get: () => () => Reflect.apply(c.finalizePendingLocaleChange, c, [])
          },
          waitForPendingLocaleChange: {
            get: () => () => Reflect.apply(c.waitForPendingLocaleChange, c, [])
          }
        }

        for (const [key, descriptor] of Object.entries(properties)) {
          Object.defineProperty(instance, key, descriptor)
        }
      }
    })

    app.use(i18n) // TODO: should implement `{ inject: false } via `nuxtjs/i18n` configuration

    // inject for nuxt helpers
    injectNuxtHelpers(nuxtContext, i18n)

    let routeChangeCount = 0

    addRouteMiddleware(
      'locale-changing',

      defineNuxtRouteMiddleware(async (to, from) => {
        __DEBUG__ && logger.log('locale-changing middleware', to, from)

        const routeLocale = getLocaleFromRoute(to)
        const locale = detectLocale(
          to,
          routeLocale,
          () => getLocale(i18n) || getDefaultLocale(runtimeI18n.defaultLocale),
          {
            ssg: isSSGModeInitialSetup() && runtimeI18n.strategy === 'no_prefix' ? 'ssg_ignore' : 'normal',
            callType: 'routing',
            firstAccess: routeChangeCount === 0,
            localeCookie: getLocaleCookie(localeCookie, _detectBrowserLanguage, runtimeI18n.defaultLocale)
          },
          runtimeI18n
        )
        __DEBUG__ && logger.log('detect locale', locale)

        const localeSetup = isInitialLocaleSetup(locale)
        __DEBUG__ && logger.log('localeSetup', localeSetup)

        const modified = await loadAndSetLocale(locale, i18n, runtimeI18n, localeSetup)

        if (modified && localeSetup) {
          notInitialSetup = false
        }

        const redirectPath = await nuxtContext.runWithContext(() =>
          detectRedirect({ route: { to, from }, locale, routeLocale, strategy: runtimeI18n.strategy }, true)
        )
        __DEBUG__ && logger.log('redirectPath on locale-changing middleware', redirectPath)

        routeChangeCount++

        return await nuxtContext.runWithContext(async () =>
          navigate({ nuxtApp: nuxtContext, i18n, redirectPath, locale, route: to })
        )
      }),
      { global: true }
    )
  }
})
