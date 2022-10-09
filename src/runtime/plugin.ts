import { computed } from 'vue-demi'
import { createI18n } from '@intlify/vue-i18n-bridge'
import {
  createLocaleFromRouteGetter,
  extendI18n,
  registerGlobalOptions,
  getRouteBaseName,
  localePath,
  localeRoute,
  switchLocalePath,
  localeHead,
  setLocale,
  getLocale
} from 'vue-i18n-routing'
import { defineNuxtPlugin, useRouter, addRouteMiddleware } from '#imports'
import { localeCodes, resolveNuxtI18nOptions, nuxtI18nInternalOptions } from '#build/i18n.options.mjs'
import {
  loadInitialMessages,
  loadAndSetLocale,
  mergeAddtionalMessages,
  detectLocale,
  detectRedirect,
  navigate,
  inejctNuxtHelpers,
  extendBaseUrl,
  extendPrefixable,
  extendSwitchLocalePathIntercepter
} from '#build/i18n.utils.mjs'
import {
  getBrowserLocale as _getBrowserLocale,
  getLocaleCookie as _getLocaleCookie,
  setLocaleCookie as _setLocaleCookie
} from '#build/i18n.internal.mjs'

import type { Composer, I18nOptions, Locale } from '@intlify/vue-i18n-bridge'
import type { LocaleObject, RouteLocationNormalized, ExtendProperyDescripters } from 'vue-i18n-routing'
import type { NuxtApp } from '#imports'

type GetRouteBaseName = typeof getRouteBaseName
type LocalePath = typeof localePath
type LocaleRoute = typeof localeRoute
type LocaleHead = typeof localeHead
type SwitchLocalePath = typeof switchLocalePath

export default defineNuxtPlugin(async nuxt => {
  const router = useRouter()
  const { vueApp: app } = nuxt
  const nuxtContext = nuxt as unknown as NuxtApp

  const nuxtI18nOptions = await resolveNuxtI18nOptions<NuxtApp>(nuxtContext)
  const useCookie = nuxtI18nOptions.detectBrowserLanguage && nuxtI18nOptions.detectBrowserLanguage.useCookie
  const { __normalizedLocales: normalizedLocales } = nuxtI18nInternalOptions
  const {
    defaultLocale,
    differentDomains,
    skipSettingLocaleOnNavigate,
    lazy,
    langDir,
    routesNameSeparator,
    defaultLocaleRouteNameSuffix
  } = nuxtI18nOptions
  __DEBUG__ && console.log('useCookie on setup', useCookie)
  __DEBUG__ && console.log('defautlLocale on setup', defaultLocale)

  nuxtI18nOptions.baseUrl = extendBaseUrl(nuxtI18nOptions.baseUrl, {
    differentDomains,
    nuxt: nuxtContext,
    localeCodeLoader: defaultLocale,
    normalizedLocales
  })
  const getLocaleFromRoute = createLocaleFromRouteGetter(localeCodes, routesNameSeparator, defaultLocaleRouteNameSuffix)

  const vueI18nOptions = nuxtI18nOptions.vueI18n as I18nOptions
  vueI18nOptions.messages = vueI18nOptions.messages || {}
  vueI18nOptions.fallbackLocale = vueI18nOptions.fallbackLocale ?? false

  // register nuxt/i18n options as global
  // so global options is reffered by `vue-i18n-routing`
  registerGlobalOptions(router, {
    ...nuxtI18nOptions,
    switchLocalePathIntercepter: extendSwitchLocalePathIntercepter(differentDomains, normalizedLocales, nuxtContext),
    prefixable: extendPrefixable(differentDomains)
  })

  // detect initial locale
  let initialLocale = detectLocale(
    router.currentRoute.value,
    nuxt.ssrContext,
    getLocaleFromRoute,
    nuxtI18nOptions,
    defaultLocale || vueI18nOptions.locale || 'en-US',
    normalizedLocales,
    localeCodes
  )
  __DEBUG__ && console.log('first detect locale', initialLocale)

  // load initial vue-i18n locale messages
  vueI18nOptions.messages = await loadInitialMessages(nuxtContext, vueI18nOptions.messages, {
    ...nuxtI18nOptions,
    initialLocale,
    fallbackLocale: vueI18nOptions.fallbackLocale,
    localeCodes
  })

  /**
   * NOTE:
   *  If `initialLocale` is not set, then the `vueI18n` option `locale` is respect!
   *  It means a mode that works only with simple vue-i18n, without nuxtjs/i18n routing, browser detection, SEO, and other features.
   */
  initialLocale = initialLocale || vueI18nOptions.locale || 'en-US'
  __DEBUG__ && console.log('final initial locale:', initialLocale)

  // create i18n instance
  const i18n = createI18n({
    ...vueI18nOptions,
    locale: initialLocale
  })

  let notInitialSetup = true
  function isInitialLocaleSetup(locale: Locale): boolean {
    return initialLocale !== locale && notInitialSetup
  }

  // extend i18n instance
  extendI18n(i18n, {
    locales: nuxtI18nOptions.locales,
    localeCodes,
    baseUrl: nuxtI18nOptions.baseUrl,
    context: nuxtContext,
    hooks: {
      onExtendComposer(composer: Composer) {
        composer.strategy = nuxtI18nOptions.strategy
        composer.localeProperties = computed(() => {
          return (
            normalizedLocales.find((l: LocaleObject) => l.code === composer.locale.value) || {
              code: composer.locale.value
            }
          )
        })
        composer.setLocale = async (locale: string) => {
          const localeSetup = isInitialLocaleSetup(locale)
          const [modified] = await loadAndSetLocale(locale, nuxtContext, i18n, {
            useCookie,
            differentDomains,
            initial: localeSetup,
            skipSettingLocaleOnNavigate,
            lazy,
            langDir
          })

          if (modified && localeSetup) {
            notInitialSetup = false
          }

          const redirectPath = detectRedirect(
            router.currentRoute.value,
            nuxtContext,
            locale,
            getLocaleFromRoute,
            nuxtI18nOptions
          )
          __DEBUG__ && console.log('redirectPath on setLocale', redirectPath)

          navigate(i18n, redirectPath, locale, {
            differentDomains,
            skipSettingLocaleOnNavigate
          })
        }
        composer.differentDomains = differentDomains
        composer.getBrowserLocale = () => _getBrowserLocale(nuxtI18nInternalOptions, nuxt.ssrContext)
        composer.getLocaleCookie = () =>
          _getLocaleCookie(nuxt.ssrContext, { ...nuxtI18nOptions.detectBrowserLanguage, localeCodes })
        composer.setLocaleCookie = (locale: string) =>
          _setLocaleCookie(locale, nuxt.ssrContext, nuxtI18nOptions.detectBrowserLanguage || undefined)
        composer.onBeforeLanguageSwitch = nuxtI18nOptions.onBeforeLanguageSwitch
        composer.onLanguageSwitched = nuxtI18nOptions.onLanguageSwitched
        composer.finalizePendingLocaleChange = async () => {
          if (!i18n.__pendingLocale) {
            return
          }
          setLocale(i18n, i18n.__pendingLocale)
          if (i18n.__resolvePendingLocalePromise) {
            await i18n.__resolvePendingLocalePromise('')
          }
          i18n.__pendingLocale = undefined
        }
        composer.waitForPendingLocaleChange = async () => {
          if (i18n.__pendingLocale && i18n.__pendingLocalePromise) {
            await i18n.__pendingLocalePromise
          }
        }
      },
      onExtendExportedGlobal(g: Composer): ExtendProperyDescripters {
        return {
          strategy: {
            get() {
              return g.strategy
            }
          },
          localeProperties: {
            get() {
              return g.localeProperties.value
            }
          },
          setLocale: {
            get() {
              return async (locale: string) => Reflect.apply(g.setLocale, g, [locale])
            }
          },
          differentDomains: {
            get() {
              return g.differentDomains
            }
          },
          getBrowserLocale: {
            get() {
              return () => Reflect.apply(g.getBrowserLocale, g, [])
            }
          },
          getLocaleCookie: {
            get() {
              return () => Reflect.apply(g.getLocaleCookie, g, [])
            }
          },
          setLocaleCookie: {
            get() {
              return (locale: string) => Reflect.apply(g.setLocaleCookie, g, [locale])
            }
          },
          onBeforeLanguageSwitch: {
            get() {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return (oldLocale: string, newLocale: string, initialSetup: boolean, context: NuxtApp) =>
                Reflect.apply(g.onBeforeLanguageSwitch, g, [oldLocale, newLocale, initialSetup, context])
            }
          },
          onLanguageSwitched: {
            get() {
              return (oldLocale: string, newLocale: string) =>
                Reflect.apply(g.onLanguageSwitched, g, [oldLocale, newLocale])
            }
          },
          finalizePendingLocaleChange: {
            get() {
              return () => Reflect.apply(g.finalizePendingLocaleChange, g, [])
            }
          },
          waitForPendingLocaleChange: {
            get() {
              return () => Reflect.apply(g.waitForPendingLocaleChange, g, [])
            }
          }
        }
      },
      onExtendVueI18n(composer: Composer): ExtendProperyDescripters {
        return {
          strategy: {
            get() {
              return composer.strategy
            }
          },
          localeProperties: {
            get() {
              return composer.localeProperties.value
            }
          },
          setLocale: {
            get() {
              return async (locale: string) => Reflect.apply(composer.setLocale, composer, [locale])
            }
          },
          differentDomains: {
            get() {
              return composer.differentDomains
            }
          },
          getBrowserLocale: {
            get() {
              return () => Reflect.apply(composer.getBrowserLocale, composer, [])
            }
          },
          getLocaleCookie: {
            get() {
              return () => Reflect.apply(composer.getLocaleCookie, composer, [])
            }
          },
          setLocaleCookie: {
            get() {
              return (locale: string) => Reflect.apply(composer.setLocaleCookie, composer, [locale])
            }
          },
          onBeforeLanguageSwitch: {
            get() {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return (oldLocale: string, newLocale: string, initialSetup: boolean, context: NuxtApp) =>
                Reflect.apply(composer.onBeforeLanguageSwitch, composer, [oldLocale, newLocale, initialSetup, context])
            }
          },
          onLanguageSwitched: {
            get() {
              return (oldLocale: string, newLocale: string) =>
                Reflect.apply(composer.onLanguageSwitched, composer, [oldLocale, newLocale])
            }
          },
          finalizePendingLocaleChange: {
            get() {
              return () => Reflect.apply(composer.finalizePendingLocaleChange, composer, [])
            }
          },
          waitForPendingLocaleChange: {
            get() {
              return () => Reflect.apply(composer.waitForPendingLocaleChange, composer, [])
            }
          }
        }
      }
    }
  })

  // install vue-i18n
  // TODO: should implement `{ inject: boolean }
  app.use(i18n)

  // inject for nuxt helpers
  inejctNuxtHelpers(nuxtContext, i18n)

  // merge addtional locale messages
  await mergeAddtionalMessages(nuxtContext, i18n, initialLocale)

  addRouteMiddleware(
    'locale-changing',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
      __DEBUG__ && console.log('locale-changing middleware')

      const locale = detectLocale(
        to,
        nuxt.ssrContext,
        getLocaleFromRoute,
        nuxtI18nOptions,
        () => {
          return getLocale(i18n) || defaultLocale || vueI18nOptions.locale || 'en-US'
        },
        normalizedLocales,
        localeCodes
      )
      __DEBUG__ && console.log('detect locale', locale)

      const localeSetup = isInitialLocaleSetup(locale)
      __DEBUG__ && console.log('localeSetup', localeSetup)

      const [modified] = await loadAndSetLocale(locale, nuxtContext, i18n, {
        useCookie,
        differentDomains,
        initial: localeSetup,
        skipSettingLocaleOnNavigate,
        lazy,
        langDir
      })

      if (modified && localeSetup) {
        notInitialSetup = false
      }

      const redirectPath = detectRedirect(to, nuxtContext, locale, getLocaleFromRoute, nuxtI18nOptions)
      __DEBUG__ && console.log('redirectPath on locale-changing middleware', redirectPath)

      navigate(i18n, redirectPath, locale, {
        differentDomains,
        skipSettingLocaleOnNavigate
      })
    },
    { global: true }
  )
})

/**
 * TODO:
 *  We should provide with using conditional exports,
 *  because, vue-i18n has legacy API (options API) and composition API.
 *
 *  The type returned by `i18n.global` dynamically depending on its options.
 *  `NuxtApp` cannot be type extended without using ambient modules,
 *  but I don't know of anything that changes this dynamically on nuxt.
 *
 */
declare module '#imports' {
  interface NuxtApp {
    $i18n: Composer
    $getRouteBaseName: (this: NuxtApp, ...args: Parameters<GetRouteBaseName>) => ReturnType<GetRouteBaseName>
    $localePath: (this: NuxtApp, ...args: Parameters<LocalePath>) => ReturnType<LocalePath>
    $localeRoute: (this: NuxtApp, ...args: Parameters<LocaleRoute>) => ReturnType<LocaleRoute>
    $localeHead: (this: NuxtApp, ...args: Parameters<LocaleHead>) => ReturnType<LocaleHead>
    $switchLocalePath: (this: NuxtApp, ...args: Parameters<SwitchLocalePath>) => ReturnType<SwitchLocalePath>
  }
}
