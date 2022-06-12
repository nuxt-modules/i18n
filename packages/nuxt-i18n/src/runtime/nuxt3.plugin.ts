import { computed } from 'vue-demi'
import { createI18n } from '@intlify/vue-i18n-bridge'
import {
  createLocaleFromRouteGetter,
  extendI18n,
  registerGlobalOptions,
  getRouteBaseName,
  localePath,
  localeLocation,
  localeRoute,
  switchLocalePath,
  localeHead
} from 'vue-i18n-routing'
import { defineNuxtPlugin, useRouter, addRouteMiddleware, navigateTo } from '#app'
import { localeCodes, resolveNuxtI18nOptions, nuxtI18nInternalOptions } from '#build/i18n.options.mjs'
import { CLIENT } from '#build/i18n.frags.mjs'
import { loadInitialMessages, loadAndSetLocale, detectLocale, detectRedirect, proxyNuxt } from '#build/i18n.utils.mjs'
import {
  getInitialLocale,
  getBrowserLocale as _getBrowserLocale,
  getLocaleCookie as _getLocaleCookie,
  setLocaleCookie as _setLocaleCookie
} from '#build/i18n.internal.mjs'

import type { Composer, I18nOptions, Locale } from '@intlify/vue-i18n-bridge'
import type { LocaleObject, RouteLocationNormalized, ExtendProperyDescripters } from 'vue-i18n-routing'

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
  const initialLocale = getInitialLocale(
    nuxt.ssrContext,
    CLIENT ? router.currentRoute : nuxt.ssrContext!.url,
    nuxtI18nOptions,
    localeCodes,
    getLocaleFromRoute
  )
  // TODO: remove console log!
  console.log('initial locale', initialLocale)

  // load initial vue-i18n locale messages
  await loadInitialMessages(nuxt.ssrContext, vueI18nOptions.messages, {
    ...nuxtI18nOptions,
    initialLocale,
    fallbackLocale: vueI18nOptions.fallbackLocale,
    localeCodes
  })
  // TODO: remove console log!
  console.log('loaded messages', vueI18nOptions.messages)

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
          const modified = await loadAndSetLocale(locale, nuxt, i18n, {
            useCookie,
            initial: localeSetup,
            lazy: nuxtI18nOptions.lazy,
            langDir: nuxtI18nOptions.langDir
          })
          if (modified && localeSetup) {
            notInitialSetup = false
          }
          const redirectPath = detectRedirect(locale, app, initialLocale, getLocaleFromRoute, nuxtI18nOptions)
          if (redirectPath) {
            navigate(nuxt.ssrContext, redirectPath)
          }
        }
        composer.getBrowserLocale = () => _getBrowserLocale(nuxtI18nInternalOptions, nuxt.ssrContext)
        composer.getLocaleCookie = () =>
          _getLocaleCookie(nuxt.ssrContext, { ...nuxtI18nOptions.detectBrowserLanguage, localeCodes })
        composer.setLocaleCookie = (locale: string) =>
          _setLocaleCookie(locale, nuxt.ssrContext, nuxtI18nOptions.detectBrowserLanguage || undefined)
        composer.onBeforeLanguageSwitch = nuxtI18nOptions.onBeforeLanguageSwitch
        composer.onLanguageSwitched = nuxtI18nOptions.onLanguageSwitched
      },
      onExtendExportedGlobal(global: Composer): ExtendProperyDescripters {
        return {
          localeProperties: {
            get() {
              return global.localeProperties.value
            }
          },
          getBrowserLocale: {
            get() {
              return () => Reflect.apply(global.getBrowserLocale, global, [])
            }
          },
          getLocaleCookie: {
            get() {
              return () => Reflect.apply(global.getLocaleCookie, global, [])
            }
          },
          setLocaleCookie: {
            get() {
              return (locale: string) => Reflect.apply(global.setLocaleCookie, global, [locale])
            }
          },
          onBeforeLanguageSwitch: {
            get() {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return (oldLocale: string, newLocale: string, initialSetup: boolean, context: any) =>
                Reflect.apply(global.onBeforeLanguageSwitch, global, [oldLocale, newLocale, initialSetup, context])
            }
          },
          onLanguageSwitched: {
            get() {
              return (oldLocale: string, newLocale: string) =>
                Reflect.apply(global.onLanguageSwitched, global, [oldLocale, newLocale])
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
              return (oldLocale: string, newLocale: string, initialSetup: boolean, context: any) =>
                Reflect.apply(composer.onBeforeLanguageSwitch, composer, [oldLocale, newLocale, initialSetup, context])
            }
          },
          onLanguageSwitched: {
            get() {
              return (oldLocale: string, newLocale: string) =>
                Reflect.apply(composer.onLanguageSwitched, composer, [oldLocale, newLocale])
            }
          }
        }
      }
    }
  })

  // install vue-i18n
  // TODO: should implement `{ inject: boolean }
  app.use(i18n)

  app.i18n = i18n.global as unknown as Composer // TODO: should resolve type!
  app.getRouteBaseName = proxyNuxt(nuxt, getRouteBaseName)
  app.localePath = proxyNuxt(nuxt, localePath)
  app.localeRoute = proxyNuxt(nuxt, localeRoute)
  app.localeLocation = proxyNuxt(nuxt, localeLocation)
  app.switchLocalePath = proxyNuxt(nuxt, switchLocalePath)
  app.localeHead = proxyNuxt(nuxt, localeHead)

  if (CLIENT) {
    addRouteMiddleware(
      'locale-changing',
      async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
        const locale = detectLocale(to, nuxt.ssrContext, i18n, getLocaleFromRoute, nuxtI18nOptions, localeCodes)
        // TODO: remove console log!
        console.log('detectlocale client return', locale)
        const localeSetup = isInitialLocaleSetup(locale)
        const modified = await loadAndSetLocale(locale, nuxt, i18n, {
          useCookie,
          initial: localeSetup,
          lazy: nuxtI18nOptions.lazy,
          langDir: nuxtI18nOptions.langDir
        })
        if (modified && localeSetup) {
          notInitialSetup = false
        }
        const redirectPath = detectRedirect(to, app, initialLocale, getLocaleFromRoute, nuxtI18nOptions)
        if (redirectPath) {
          navigate(nuxt.ssrContext, redirectPath)
        }
      },
      { global: true }
    )
  } else {
    const routeURL = nuxt.ssrContext!.url
    const locale = detectLocale(routeURL, nuxt.ssrContext, i18n, getLocaleFromRoute, nuxtI18nOptions, localeCodes)
    // TODO: remove console log!
    console.log('detectlocale server return', locale)
    await loadAndSetLocale(locale || nuxtI18nOptions.defaultLocale, nuxt, i18n, {
      useCookie,
      lazy: nuxtI18nOptions.lazy,
      langDir: nuxtI18nOptions.langDir
    })
    const redirectPath = detectRedirect(routeURL, app, initialLocale, getLocaleFromRoute, nuxtI18nOptions)
    if (redirectPath) {
      navigate(nuxt.ssrContext, redirectPath)
    }
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function navigate(context: any, redirectPath: string, status = 302) {
  await navigateTo(redirectPath)
}
