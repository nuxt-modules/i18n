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
  DefaultDetectBrowserLanguageFromResult,
  getI18nCookie,
  runtimeDetectBrowserLanguage
} from '../internal'
import { inBrowser, resolveBaseUrl } from '../routing/utils'
import { extendI18n, createLocaleFromRouteGetter } from '../routing/extends'

import type { LocaleObject } from '#build/i18n.options.mjs'
import type { Locale, I18nOptions } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { getRouteBaseName, localePath, localeRoute, switchLocalePath, localeHead } from '../routing/compatibles'
import type {
  LocaleHeadFunction,
  LocalePathFunction,
  LocaleRouteFunction,
  RouteBaseNameFunction,
  SwitchLocalePathFunction
} from '../composables'
import { _setLocale, getLocale, mergeLocaleMessage, setLocale } from '../compatibility'

export default defineNuxtPlugin({
  name: 'i18n:plugin',
  parallel: parallelPlugin,
  async setup(nuxt) {
    const route = useRoute()
    const { vueApp: app } = nuxt
    const nuxtContext = nuxt as unknown as NuxtApp

    // Fresh copy per request to prevent reusing mutated options
    const runtimeI18n = { ...nuxtContext.$config.public.i18n }
    // @ts-expect-error type incompatible
    runtimeI18n.baseUrl = extendBaseUrl()

    const _detectBrowserLanguage = runtimeDetectBrowserLanguage()

    __DEBUG__ && console.log('isSSG', isSSG)
    __DEBUG__ && console.log('useCookie on setup', _detectBrowserLanguage && _detectBrowserLanguage.useCookie)
    __DEBUG__ && console.log('defaultLocale on setup', runtimeI18n.defaultLocale)

    const vueI18nOptions: I18nOptions = await loadVueI18nOptions(vueI18nConfigs, useNuxtApp())
    vueI18nOptions.messages = vueI18nOptions.messages || {}
    vueI18nOptions.fallbackLocale = vueI18nOptions.fallbackLocale ?? false

    const getLocaleFromRoute = createLocaleFromRouteGetter()
    const getDefaultLocale = (defaultLocale: string) => defaultLocale || vueI18nOptions.locale || 'en-US'

    const localeCookie = getI18nCookie()
    // detect initial locale
    let initialLocale = detectLocale(
      route,
      getLocaleFromRoute,
      vueI18nOptions.locale,
      getDefaultLocale(runtimeI18n.defaultLocale),
      {
        ssg: isSSG && runtimeI18n.strategy === 'no_prefix' ? 'ssg_ignore' : 'normal',
        callType: 'setup',
        firstAccess: true,
        localeCookie: getLocaleCookie(localeCookie, _detectBrowserLanguage, runtimeI18n.defaultLocale)
      },
      runtimeI18n
    )
    __DEBUG__ && console.log('first detect initial locale', initialLocale)

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
    __DEBUG__ && console.log('final initial locale:', initialLocale)

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
      nuxt.hook('app:mounted', async () => {
        __DEBUG__ && console.log('hook app:mounted')
        const {
          locale: browserLocale,
          stat,
          reason,
          from
        } = _detectBrowserLanguage
          ? detectBrowserLanguage(
              route,
              vueI18nOptions.locale,
              {
                ssg: 'ssg_setup',
                callType: 'setup',
                firstAccess: true,
                localeCookie: getLocaleCookie(localeCookie, _detectBrowserLanguage, runtimeI18n.defaultLocale)
              },
              initialLocale
            )
          : DefaultDetectBrowserLanguageFromResult
        __DEBUG__ &&
          console.log(
            'app:mounted: detectBrowserLanguage (browserLocale, stat, reason, from) -',
            browserLocale,
            stat,
            reason,
            from
          )
        await _setLocale(i18n, browserLocale)
        ssgModeInitialSetup = false
      })
    }

    // extend i18n instance
    extendI18n(i18n, {
      extendComposer(composer) {
        const route = useRoute()
        const _locales = ref<string[] | LocaleObject[]>(runtimeI18n.configLocales)
        const _localeCodes = ref<string[]>(localeCodes)
        const _baseUrl = ref<string>('')

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
              targetLocale: locale,
              routeLocaleGetter: getLocaleFromRoute
            })
          )
          __DEBUG__ && console.log('redirectPath on setLocale', redirectPath)

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
          nuxt.callHook('i18n:beforeLocaleSwitch', { oldLocale, newLocale, initialSetup, context }) as Promise<void>
        composer.onLanguageSwitched = (oldLocale, newLocale) =>
          nuxt.callHook('i18n:localeSwitched', { oldLocale, newLocale }) as Promise<void>

        composer.finalizePendingLocaleChange = async () => {
          if (!i18n.__pendingLocale) {
            return
          }
          setLocale(i18n, i18n.__pendingLocale)
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
        __DEBUG__ && console.log('locale-changing middleware', to, from)

        const locale = detectLocale(
          to,
          getLocaleFromRoute,
          vueI18nOptions.locale,
          () => {
            return getLocale(i18n) || getDefaultLocale(runtimeI18n.defaultLocale)
          },
          {
            ssg: isSSGModeInitialSetup() && runtimeI18n.strategy === 'no_prefix' ? 'ssg_ignore' : 'normal',
            callType: 'routing',
            firstAccess: routeChangeCount === 0,
            localeCookie: getLocaleCookie(localeCookie, _detectBrowserLanguage, runtimeI18n.defaultLocale)
          },
          runtimeI18n
        )
        __DEBUG__ && console.log('detect locale', locale)

        const localeSetup = isInitialLocaleSetup(locale)
        __DEBUG__ && console.log('localeSetup', localeSetup)

        const modified = await loadAndSetLocale(locale, i18n, runtimeI18n, localeSetup)

        if (modified && localeSetup) {
          notInitialSetup = false
        }

        const redirectPath = await nuxtContext.runWithContext(() =>
          detectRedirect({
            route: { to, from },
            targetLocale: locale,
            routeLocaleGetter: runtimeI18n.strategy === 'no_prefix' ? () => locale : getLocaleFromRoute,
            calledWithRouting: true
          })
        )
        __DEBUG__ && console.log('redirectPath on locale-changing middleware', redirectPath)

        routeChangeCount++

        return await nuxtContext.runWithContext(async () =>
          navigate({ nuxtApp: nuxtContext, i18n, redirectPath, locale, route: to })
        )
      }),
      { global: true }
    )
  }
})

declare module '#app' {
  interface NuxtApp {
    /**
     * Returns base name of current (if argument not provided) or passed in route.
     *
     * @remarks
     * Base name is name of the route without locale suffix and other metadata added by nuxt i18n module
     *
     * @param givenRoute - A route.
     *
     * @returns The route base name. if cannot get, `undefined` is returned.
     */
    $getRouteBaseName: (...args: Parameters<RouteBaseNameFunction>) => ReturnType<typeof getRouteBaseName>
    /**
     * Returns localized path for passed in route.
     *
     * @remarks
     * If locale is not specified, uses current locale.
     *
     * @param route - A route.
     * @param locale - A locale, optional.
     *
     * @returns A path of the current route.
     */
    $localePath: (...args: Parameters<LocalePathFunction>) => ReturnType<typeof localePath>
    /**
     * Returns localized route for passed in `route` parameters.
     *
     * @remarks
     * If `locale` is not specified, uses current locale.
     *
     * @param route - A route.
     * @param locale - A {@link Locale | locale}, optional.
     *
     * @returns A route. if cannot resolve, `undefined` is returned.
     */
    $localeRoute: (...args: Parameters<LocaleRouteFunction>) => ReturnType<typeof localeRoute>
    /**
     * Returns localized head properties for locale-related aspects.
     *
     * @param options - An options object, see `I18nHeadOptions`.
     *
     * @returns The localized head properties.
     */
    $localeHead: (...args: Parameters<LocaleHeadFunction>) => ReturnType<typeof localeHead>
    /**
     * Returns path of the current route for specified locale
     *
     * @param locale - A {@link Locale}
     *
     * @returns A path of the current route
     */
    $switchLocalePath: (...args: Parameters<SwitchLocalePathFunction>) => ReturnType<typeof switchLocalePath>
  }
}
