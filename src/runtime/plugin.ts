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
  setLocale
} from 'vue-i18n-routing'
import { defineNuxtPlugin, useRouter, addRouteMiddleware } from '#imports'
import { localeCodes, resolveNuxtI18nOptions, nuxtI18nInternalOptions } from '#build/i18n.options.mjs'
import {
  loadInitialMessages,
  loadAndSetLocale,
  detectLocale,
  detectRedirect,
  onLanguageSwitched,
  navigate,
  inejctNuxtHelpers
} from '#build/i18n.utils.mjs'
import {
  getInitialLocale,
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

  const nuxtI18nOptions = await resolveNuxtI18nOptions(nuxt)
  const useCookie = nuxtI18nOptions.detectBrowserLanguage && nuxtI18nOptions.detectBrowserLanguage.useCookie
  const getLocaleFromRoute = createLocaleFromRouteGetter(
    localeCodes,
    nuxtI18nOptions.routesNameSeparator,
    nuxtI18nOptions.defaultLocaleRouteNameSuffix
  )

  const vueI18nOptions = nuxtI18nOptions.vueI18n as I18nOptions
  vueI18nOptions.messages = vueI18nOptions.messages || {}
  vueI18nOptions.fallbackLocale = vueI18nOptions.fallbackLocale ?? false

  // register nuxt/i18n options as global
  // so global options is reffered by `vue-i18n-routing`
  registerGlobalOptions(router, nuxtI18nOptions)

  // detect initial locale
  let initialLocale = getInitialLocale(
    nuxt.ssrContext,
    router.currentRoute.value,
    nuxtI18nOptions,
    localeCodes,
    getLocaleFromRoute
  )

  // load initial vue-i18n locale messages
  await loadInitialMessages(nuxt as unknown as NuxtApp, vueI18nOptions.messages, {
    ...nuxtI18nOptions,
    initialLocale,
    fallbackLocale: vueI18nOptions.fallbackLocale,
    localeCodes
  })

  /**
   * NOTE:
   *  If `initLocale` is not set, then the `vueI18n` option `locale` is respect!
   *  It means a mode that works only with simple vue-i18n, without nuxtjs/i18n routing, browser detection, SEO, and other features.
   */
  initialLocale ||= vueI18nOptions.locale || 'en-US'

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
    hooks: {
      onExtendComposer(composer: Composer) {
        composer.localeProperties = computed(() => {
          return (
            nuxtI18nInternalOptions.__normalizedLocales.find((l: LocaleObject) => l.code === composer.locale.value) || {
              code: composer.locale.value
            }
          )
        })
        composer.setLocale = async (locale: string) => {
          const localeSetup = isInitialLocaleSetup(locale)
          const [modified, oldLocale] = await loadAndSetLocale(locale, nuxt as unknown as NuxtApp, i18n, {
            useCookie,
            initial: localeSetup,
            skipSettingLocaleOnNavigate: nuxtI18nOptions.skipSettingLocaleOnNavigate,
            lazy: nuxtI18nOptions.lazy,
            langDir: nuxtI18nOptions.langDir
          })

          if (modified && localeSetup) {
            notInitialSetup = false
          }

          if (!notInitialSetup) {
            onLanguageSwitched(i18n, oldLocale, locale)
          }

          const redirectPath = detectRedirect(
            locale,
            nuxt as unknown as NuxtApp,
            initialLocale,
            getLocaleFromRoute,
            nuxtI18nOptions
          )
          navigate(i18n, redirectPath, locale, {
            skipSettingLocaleOnNavigate: nuxtI18nOptions.skipSettingLocaleOnNavigate
          })
        }
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
          localeProperties: {
            get() {
              return g.localeProperties.value
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
          localeProperties: {
            get() {
              return composer.localeProperties.value
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
  inejctNuxtHelpers(nuxt as unknown as NuxtApp, i18n)

  if (process.client) {
    addRouteMiddleware(
      'locale-changing',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
        const locale = detectLocale(to, nuxt.ssrContext, i18n, getLocaleFromRoute, nuxtI18nOptions, localeCodes)
        const localeSetup = isInitialLocaleSetup(locale)
        const [modified, oldLocale] = await loadAndSetLocale(locale, nuxt as unknown as NuxtApp, i18n, {
          useCookie,
          initial: localeSetup,
          skipSettingLocaleOnNavigate: nuxtI18nOptions.skipSettingLocaleOnNavigate,
          lazy: nuxtI18nOptions.lazy,
          langDir: nuxtI18nOptions.langDir
        })

        if (modified && localeSetup) {
          notInitialSetup = false
        }

        if (!notInitialSetup) {
          onLanguageSwitched(i18n, oldLocale, locale)
        }

        const redirectPath = detectRedirect(
          to,
          nuxt as unknown as NuxtApp,
          initialLocale,
          getLocaleFromRoute,
          nuxtI18nOptions
        )
        navigate(i18n, redirectPath, locale, {
          skipSettingLocaleOnNavigate: nuxtI18nOptions.skipSettingLocaleOnNavigate
        })
      },
      { global: true }
    )
  } else {
    // TODO: we should use `addRouteMiddleware` in server-side
    //       `addRouteMiddleware` does not work on server...
    const route = router.currentRoute.value
    const locale = detectLocale(route, nuxt.ssrContext, i18n, getLocaleFromRoute, nuxtI18nOptions, localeCodes)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [modified, oldLocale] = await loadAndSetLocale(
      locale || nuxtI18nOptions.defaultLocale,
      nuxt as unknown as NuxtApp,
      i18n,
      {
        useCookie,
        skipSettingLocaleOnNavigate: nuxtI18nOptions.skipSettingLocaleOnNavigate,
        lazy: nuxtI18nOptions.lazy,
        langDir: nuxtI18nOptions.langDir
      }
    )

    if (!notInitialSetup) {
      onLanguageSwitched(i18n, oldLocale, locale)
    }

    const redirectPath = detectRedirect(
      route,
      nuxt as unknown as NuxtApp,
      initialLocale,
      getLocaleFromRoute,
      nuxtI18nOptions
    )
    navigate(i18n, redirectPath, locale, { skipSettingLocaleOnNavigate: nuxtI18nOptions.skipSettingLocaleOnNavigate })
  }
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
