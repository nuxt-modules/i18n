import { computed } from 'vue'
import { createI18n } from 'vue-i18n'
import { defineNuxtPlugin, useRoute, addRouteMiddleware, defineNuxtRouteMiddleware, useNuxtApp } from '#imports'
import {
  localeCodes,
  vueI18nConfigs,
  nuxtI18nOptions as _nuxtI18nOptions,
  isSSG,
  localeLoaders,
  parallelPlugin,
  normalizedLocales
} from '#build/i18n.options.mjs'
import { loadVueI18nOptions, loadInitialMessages } from '../messages'
import {
  loadAndSetLocale,
  detectLocale,
  detectRedirect,
  navigate,
  injectNuxtHelpers,
  extendBaseUrl,
  _setLocale
} from '../utils'
import {
  getBrowserLocale as _getBrowserLocale,
  getLocaleCookie as _getLocaleCookie,
  setLocaleCookie as _setLocaleCookie,
  detectBrowserLanguage,
  DefaultDetectBrowserLanguageFromResult,
  getI18nCookie
} from '../internal'
import { getComposer, getLocale, setLocale } from '../routing/utils'
import { extendI18n, createLocaleFromRouteGetter } from '../routing/extends'

import type { Composer, Locale, I18nOptions } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { ExtendPropertyDescriptors, VueI18nRoutingPluginOptions } from '../routing/extends'
import type { getRouteBaseName, localePath, localeRoute, switchLocalePath, localeHead } from '../routing/compatibles'
import type {
  LocaleHeadFunction,
  LocalePathFunction,
  LocaleRouteFunction,
  SwitchLocalePathFunction
} from '../composables'

export default defineNuxtPlugin({
  name: 'i18n:plugin',
  parallel: parallelPlugin,
  async setup(nuxt) {
    const route = useRoute()
    const { vueApp: app } = nuxt
    const nuxtContext = nuxt as unknown as NuxtApp

    // Fresh copy per request to prevent reusing mutated options
    const nuxtI18nOptions = { ..._nuxtI18nOptions }
    nuxtI18nOptions.baseUrl = extendBaseUrl()

    __DEBUG__ && console.log('isSSG', isSSG)
    __DEBUG__ &&
      console.log(
        'useCookie on setup',
        nuxtI18nOptions.detectBrowserLanguage && nuxtI18nOptions.detectBrowserLanguage.useCookie
      )
    __DEBUG__ && console.log('defaultLocale on setup', nuxtI18nOptions.defaultLocale)

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
      getDefaultLocale(nuxtI18nOptions.defaultLocale),
      {
        ssg: isSSG && nuxtI18nOptions.strategy === 'no_prefix' ? 'ssg_ignore' : 'normal',
        callType: 'setup',
        firstAccess: true,
        localeCookie
      }
    )
    __DEBUG__ && console.log('first detect initial locale', initialLocale)

    // load initial vue-i18n locale messages
    vueI18nOptions.messages = await loadInitialMessages(vueI18nOptions.messages, localeLoaders, {
      localeCodes,
      initialLocale,
      lazy: nuxtI18nOptions.lazy,
      defaultLocale: nuxtI18nOptions.defaultLocale,
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
    if (isSSGModeInitialSetup() && nuxtI18nOptions.strategy === 'no_prefix' && process.client) {
      nuxt.hook('app:mounted', async () => {
        __DEBUG__ && console.log('hook app:mounted')
        const {
          locale: browserLocale,
          stat,
          reason,
          from
        } = nuxtI18nOptions.detectBrowserLanguage
          ? detectBrowserLanguage(
              route,
              vueI18nOptions.locale,
              { ssg: 'ssg_setup', callType: 'setup', firstAccess: true, localeCookie },
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
        _setLocale(i18n, browserLocale)
        ssgModeInitialSetup = false
      })
    }

    // extend i18n instance
    extendI18n(i18n, {
      // @ts-ignore
      locales: nuxtI18nOptions.locales,
      localeCodes,
      baseUrl: nuxtI18nOptions.baseUrl,
      context: nuxtContext,
      hooks: {
        onExtendComposer(composer: Composer) {
          composer.strategy = nuxtI18nOptions.strategy
          composer.localeProperties = computed(
            () => normalizedLocales.find(l => l.code === composer.locale.value) || { code: composer.locale.value }
          )
          composer.setLocale = async (locale: string) => {
            const localeSetup = isInitialLocaleSetup(locale)
            const [modified] = await loadAndSetLocale(locale, i18n, localeSetup)

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
          composer.differentDomains = nuxtI18nOptions.differentDomains
          composer.defaultLocale = nuxtI18nOptions.defaultLocale
          composer.getBrowserLocale = () => _getBrowserLocale()
          composer.getLocaleCookie = () => _getLocaleCookie(localeCookie)
          composer.setLocaleCookie = (locale: string) => _setLocaleCookie(localeCookie, locale)

          composer.onBeforeLanguageSwitch = (oldLocale, newLocale, initialSetup, context) =>
            nuxt.callHook('i18n:beforeLocaleSwitch', { oldLocale, newLocale, initialSetup, context })
          composer.onLanguageSwitched = (oldLocale, newLocale) =>
            nuxt.callHook('i18n:localeSwitched', { oldLocale, newLocale })

          composer.finalizePendingLocaleChange = async () => {
            if (!i18n.__pendingLocale) {
              return
            }
            setLocale(i18n, i18n.__pendingLocale)
            if (i18n.__resolvePendingLocalePromise) {
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
        onExtendExportedGlobal(g: Composer): ExtendPropertyDescriptors {
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
            defaultLocale: {
              get() {
                return g.defaultLocale
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
        onExtendVueI18n(composer: Composer): ExtendPropertyDescriptors {
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
            defaultLocale: {
              get() {
                return composer.defaultLocale
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
                  Reflect.apply(composer.onBeforeLanguageSwitch, composer, [
                    oldLocale,
                    newLocale,
                    initialSetup,
                    context
                  ])
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

    // vue-i18n installation
    const pluginOptions: VueI18nRoutingPluginOptions = {
      __composerExtend: (c: Composer) => {
        const g = getComposer(i18n)
        c.strategy = g.strategy
        c.localeProperties = computed(() => g.localeProperties.value)
        c.setLocale = g.setLocale
        c.differentDomains = g.differentDomains
        c.getBrowserLocale = g.getBrowserLocale
        c.getLocaleCookie = g.getLocaleCookie
        c.setLocaleCookie = g.setLocaleCookie
        c.onBeforeLanguageSwitch = g.onBeforeLanguageSwitch
        c.onLanguageSwitched = g.onLanguageSwitched
        c.finalizePendingLocaleChange = g.finalizePendingLocaleChange
        c.waitForPendingLocaleChange = g.waitForPendingLocaleChange
        return () => {}
      }
    }
    app.use(i18n, pluginOptions) // TODO: should implement `{ inject: false } via `nuxtjs/i18n` configuration

    // inject for nuxt helpers
    injectNuxtHelpers(nuxtContext, i18n)

    let routeChangeCount = 0

    addRouteMiddleware(
      'locale-changing',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      defineNuxtRouteMiddleware(async (to, from) => {
        __DEBUG__ && console.log('locale-changing middleware', to, from)

        const locale = detectLocale(
          to,
          getLocaleFromRoute,
          vueI18nOptions.locale,
          () => {
            return getLocale(i18n) || getDefaultLocale(nuxtI18nOptions.defaultLocale)
          },
          {
            ssg: isSSGModeInitialSetup() && nuxtI18nOptions.strategy === 'no_prefix' ? 'ssg_ignore' : 'normal',
            callType: 'routing',
            firstAccess: routeChangeCount === 0,
            localeCookie
          }
        )
        __DEBUG__ && console.log('detect locale', locale)

        const localeSetup = isInitialLocaleSetup(locale)
        __DEBUG__ && console.log('localeSetup', localeSetup)

        const [modified] = await loadAndSetLocale(locale, i18n, localeSetup)

        if (modified && localeSetup) {
          notInitialSetup = false
        }

        const redirectPath = await nuxtContext.runWithContext(() =>
          detectRedirect({
            route: { to, from },
            targetLocale: locale,
            routeLocaleGetter: nuxtI18nOptions.strategy === 'no_prefix' ? () => locale : getLocaleFromRoute,
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
    $getRouteBaseName: (...args: Parameters<typeof getRouteBaseName>) => ReturnType<typeof getRouteBaseName>
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
