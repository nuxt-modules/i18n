import { computed, ref, watch } from 'vue'
import { createI18n } from 'vue-i18n'
import { defineNuxtPlugin, useRoute, addRouteMiddleware, defineNuxtRouteMiddleware, useNuxtApp } from '#imports'
import {
  localeCodes,
  vueI18nConfigs,
  isSSG,
  hasPages,
  localeLoaders,
  parallelPlugin,
  normalizedLocales
} from '#build/i18n.options.mjs'
import { loadVueI18nOptions, loadLocale } from '../messages'
import { loadAndSetLocale, detectLocale, detectRedirect, navigate, injectNuxtHelpers, extendBaseUrl } from '../utils'
import {
  getBrowserLocale,
  getLocaleCookie,
  setLocaleCookie,
  getI18nCookie,
  runtimeDetectBrowserLanguage,
  getDefaultLocaleForDomain,
  setupMultiDomainLocales
} from '../internal'
import { inBrowser, resolveBaseUrl } from '../routing/utils'
import { extendI18n } from '../routing/extends/i18n'
import { createLocaleFromRouteGetter } from '../routing/extends/router'
import { mergeLocaleMessage, setLocaleProperty, getI18nTarget, getLocale } from '../compatibility'
import { createLogger } from 'virtual:nuxt-i18n-logger'

import type { NuxtI18nPluginInjections } from '../injections'
import type { Locale, I18nOptions } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { LocaleObject } from '#internal-i18n-types'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'

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
    // const route = useRoute()
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
    const localeCookie = getI18nCookie()

    // create i18n instance
    const i18n = createI18n({ ...vueI18nOptions, locale: 'en' })

    /**
     * NOTE:
     *  avoid hydration mismatch for SSG mode
     */
    // if (isSSGModeInitialSetup() && runtimeI18n.strategy === 'no_prefix' && import.meta.client) {
    //   const initialLocaleCookie = localeCookie.value
    //   nuxt.hook('app:mounted', async () => {
    //     __DEBUG__ && logger.log('hook app:mounted')
    //     const detected = detectBrowserLanguage(
    //       route,
    //       {
    //         ssg: 'ssg_setup',
    //         callType: 'setup',
    //         firstAccess: true,
    //         localeCookie: initialLocaleCookie
    //       },
    //       'en'
    //     )
    //     __DEBUG__ && logger.log('app:mounted: detectBrowserLanguage (locale, reason, from) -', Object.values(detected))
    //     await setLocale(i18n, detected.locale)
    //     ssgModeInitialSetup = false
    //   })
    // }
    let firstAccessHandled = false

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
          await loadAndSetLocale(locale, i18n, runtimeI18n, !firstAccessHandled)

          if (!hasPages) return
          const redirectPath = await nuxtContext.runWithContext(() =>
            detectRedirect({
              route: { to: route },
              locale: locale,
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
                  locale: locale,
                  // @ts-expect-error type conflict
                  route: nuxtContext.$router.currentRoute.value
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

    const currentRoute = nuxtContext.$router.currentRoute

    // router is disabled / project has no pages
    if (!hasPages) {
      const detected = detectLocale(
        // @ts-expect-error type conflict
        currentRoute.value,
        // @ts-expect-error type conflict
        getLocaleFromRoute(currentRoute.value),
        undefined,
        {
          callType: 'setup',
          firstAccess: true,
          localeCookie: getLocaleCookie(localeCookie, _detectBrowserLanguage, runtimeI18n.defaultLocale)
        },
        runtimeI18n
      )
      await loadAndSetLocale(detected, i18n, runtimeI18n, true)
      await getI18nTarget(i18n).loadLocaleMessages(detected)
      return
    }

    addRouteMiddleware(
      'locale-changing',

      defineNuxtRouteMiddleware(async (to, from) => {
        __DEBUG__ && logger.log('locale-changing middleware', to, from)

        const routeLocale = getLocaleFromRoute(to)
        let locale = detectLocale(
          to,
          routeLocale,
          getLocale(i18n),
          {
            // ssg: isSSGModeInitialSetup() && runtimeI18n.strategy === 'no_prefix' ? 'ssg_ignore' : 'normal',
            ssg: 'normal',
            callType: 'routing',
            firstAccess: !firstAccessHandled,
            localeCookie: getLocaleCookie(localeCookie, _detectBrowserLanguage, runtimeI18n.defaultLocale)
          },
          runtimeI18n
        )
        __DEBUG__ && logger.log('detect locale', locale)

        if (!firstAccessHandled) {
          setLocaleProperty(i18n, locale)
          await getI18nTarget(i18n).loadLocaleMessages(locale)
        }
        console.log('detect locale', { routeLocale, locale })

        const _modified = await loadAndSetLocale(locale, i18n, runtimeI18n, !firstAccessHandled)
        if (_modified) {
          locale = getLocale(i18n)
        }

        const redirectPath = await nuxtContext.runWithContext(() =>
          detectRedirect({ route: { to, from }, locale: locale, routeLocale, strategy: runtimeI18n.strategy }, true)
        )

        firstAccessHandled ||= true

        __DEBUG__ && logger.log('redirectPath on locale-changing middleware', redirectPath)

        return await nuxtContext.runWithContext(
          async () => await navigate({ nuxtApp: nuxtContext, i18n, redirectPath, locale: locale, route: to })
        )
      }),
      { global: true }
    )
  }
})
