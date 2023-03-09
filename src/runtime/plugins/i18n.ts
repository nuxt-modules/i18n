import { computed } from 'vue'
import { createI18n } from 'vue-i18n'
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
  getLocale,
  getComposer
} from 'vue-i18n-routing'
import { defineNuxtPlugin, useRouter, useRoute, addRouteMiddleware, defineNuxtRouteMiddleware } from '#imports'
import { localeCodes, resolveNuxtI18nOptions, nuxtI18nInternalOptions, isSSG, isSSR } from '#build/i18n.options.mjs'
import {
  loadInitialMessages,
  loadAndSetLocale,
  mergeAdditionalMessages,
  detectLocale,
  detectRedirect,
  navigate,
  inejctNuxtHelpers,
  extendBaseUrl,
  extendPrefixable,
  extendSwitchLocalePathIntercepter,
  _setLocale
} from '#build/i18n.utils.mjs'
import {
  getBrowserLocale as _getBrowserLocale,
  getLocaleCookie as _getLocaleCookie,
  setLocaleCookie as _setLocaleCookie,
  detectBrowserLanguage,
  DefaultDetectBrowserLanguageFromResult
} from '#build/i18n.internal.mjs'

import type { Composer, I18nOptions, Locale } from 'vue-i18n'
import type { LocaleObject, ExtendProperyDescripters, VueI18nRoutingPluginOptions } from 'vue-i18n-routing'
import type { NuxtApp } from '#imports'

type GetRouteBaseName = typeof getRouteBaseName
type LocalePath = typeof localePath
type LocaleRoute = typeof localeRoute
type LocaleHead = typeof localeHead
type SwitchLocalePath = typeof switchLocalePath

export default defineNuxtPlugin(async nuxt => {
  const router = useRouter()
  const route = useRoute()
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
    defaultLocaleRouteNameSuffix,
    strategy,
    rootRedirect
  } = nuxtI18nOptions
  __DEBUG__ && console.log('isSSR', isSSR, ', isSSG', isSSG)
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
    dynamicRouteParamsKey: 'nuxtI18n',
    switchLocalePathIntercepter: extendSwitchLocalePathIntercepter(differentDomains, normalizedLocales, nuxtContext),
    prefixable: extendPrefixable(differentDomains)
  })

  const getDefaultLocale = (defaultLocale: string) => defaultLocale || vueI18nOptions.locale || 'en-US'

  // detect initial locale
  let initialLocale = detectLocale(
    route,
    nuxt.ssrContext,
    getLocaleFromRoute,
    nuxtI18nOptions,
    getDefaultLocale(defaultLocale),
    normalizedLocales,
    localeCodes,
    isSSG && strategy === 'no_prefix' ? 'ssg_ignore' : 'normal'
  )
  __DEBUG__ && console.log('first detect initial locale', initialLocale)

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
  initialLocale = getDefaultLocale(initialLocale)
  __DEBUG__ && console.log('final initial locale:', initialLocale)

  // create i18n instance
  const i18n = createI18n({
    ...vueI18nOptions,
    locale: initialLocale
  })

  let notInitialSetup = true
  const isInitialLocaleSetup = (locale: Locale) => initialLocale !== locale && notInitialSetup

  let ssgModeInitialSetup = true
  const isSSGModeInitialSetup = () => isSSG && ssgModeInitialSetup

  /**
   * NOTE:
   *  avoid hydaration miss match for SSG mode
   */
  if (isSSGModeInitialSetup() && strategy === 'no_prefix' && process.client) {
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
            nuxtContext,
            nuxtI18nOptions,
            nuxtI18nInternalOptions,
            localeCodes,
            initialLocale,
            'ssg_setup'
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
    locales: nuxtI18nOptions.locales,
    localeCodes,
    baseUrl: nuxtI18nOptions.baseUrl,
    context: nuxtContext,
    hooks: {
      onExtendComposer(composer: Composer) {
        composer.strategy = strategy
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

          const redirectPath = detectRedirect(route, nuxtContext, locale, getLocaleFromRoute, nuxtI18nOptions)
          __DEBUG__ && console.log('redirectPath on setLocale', redirectPath)

          await navigate(
            {
              i18n,
              redirectPath,
              locale,
              route
            },
            {
              differentDomains,
              skipSettingLocaleOnNavigate,
              rootRedirect
            }
          )
        }
        composer.differentDomains = differentDomains
        composer.getBrowserLocale = () => _getBrowserLocale(nuxtI18nInternalOptions, nuxt.ssrContext)
        composer.getLocaleCookie = () =>
          _getLocaleCookie(nuxt.ssrContext, { ...nuxtI18nOptions.detectBrowserLanguage, localeCodes })
        composer.setLocaleCookie = (locale: string) =>
          _setLocaleCookie(locale, nuxt.ssrContext, nuxtI18nOptions.detectBrowserLanguage || undefined)

        // @ts-ignore
        composer.onBeforeLanguageSwitch = (o, n, i, ctx) => nuxt.callHook('i18n:before-lang-switch', o, n, i, ctx)
        // @ts-ignore
        composer.onLanguageSwitched = (o, n) => nuxt.callHook('i18n:lang-switched', o, n)

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
    }
  }
  app.use(i18n, pluginOptions) // TODO: should implement `{ inject: false } via `nuxtjs/i18n` configuration

  // inject for nuxt helpers
  inejctNuxtHelpers(nuxtContext, i18n)

  // merge addtional locale messages
  await mergeAdditionalMessages(nuxtContext, i18n, initialLocale)

  addRouteMiddleware(
    'locale-changing',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    defineNuxtRouteMiddleware(async (to, from) => {
      __DEBUG__ && console.log('locale-changing middleware', to, from)

      const locale = detectLocale(
        to,
        nuxt.ssrContext,
        getLocaleFromRoute,
        nuxtI18nOptions,
        () => {
          return getLocale(i18n) || getDefaultLocale(defaultLocale)
        },
        normalizedLocales,
        localeCodes,
        isSSGModeInitialSetup() && strategy === 'no_prefix' ? 'ssg_ignore' : 'normal'
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

      return navigate(
        {
          i18n,
          redirectPath,
          locale,
          route: to
        },
        {
          differentDomains,
          skipSettingLocaleOnNavigate,
          rootRedirect
        }
      )
    }),
    { global: true }
  )
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
    $getRouteBaseName: (...args: Parameters<GetRouteBaseName>) => ReturnType<GetRouteBaseName>
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
    $localePath: (...args: Parameters<LocalePath>) => ReturnType<LocalePath>
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
    $localeRoute: (...args: Parameters<LocaleRoute>) => ReturnType<LocaleRoute>
    /**
     * Returns localized head properties for locale-related aspects.
     *
     * @param options - An options, see about details [I18nHeadOptions](https://github.com/intlify/routing/blob/main/packages/vue-i18n-routing/api.md#i18nheadoptions).
     *
     * @returns The localized [head properties](https://github.com/intlify/routing/blob/main/packages/vue-i18n-routing/api.md#i18nheadmetainfo).
     */
    $localeHead: (...args: Parameters<LocaleHead>) => ReturnType<LocaleHead>
    /**
     * Returns path of the current route for specified locale
     *
     * @param locale - A {@link Locale}
     *
     * @returns A path of the current route
     */
    $switchLocalePath: (...args: Parameters<SwitchLocalePath>) => ReturnType<SwitchLocalePath>
  }
}
