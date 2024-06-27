import { computed, effectScope, ref, useRoute, watch, type Ref } from '#imports'
import { resolveBaseUrl, isVueI18n, getComposer, inBrowser, setLocale } from '../utils'
import {
  getRouteBaseName,
  localeHead,
  localeLocation,
  localePath,
  localeRoute,
  resolveRoute,
  switchLocalePath
} from '../compatibles'
import {
  wrapComposable,
  getBrowserLocale as _getBrowserLocale,
  getLocaleCookie as _getLocaleCookie,
  setLocaleCookie as _setLocaleCookie,
  getI18nCookie,
  runtimeDetectBrowserLanguage
} from '../../internal'
import {
  detectRedirect,
  initCommonComposableOptions,
  loadAndSetLocale,
  mergeLocaleMessage,
  navigate
} from '../../utils'
import { localeLoaders, normalizedLocales } from '#build/i18n.options.mjs'

import type { NuxtApp } from 'nuxt/app'
import type {
  Composer,
  ComposerExtender,
  ExportedGlobalComposer,
  I18n,
  Locale,
  VueI18n,
  VueI18nExtender
} from 'vue-i18n'
import type { LocaleObject } from '#build/i18n.options.mjs'
import type { ModulePublicRuntimeConfig } from '../../../module'
import { loadLocale } from '../../messages'
import { createLocaleFromRouteGetter } from './router'

/**
 * Options of Vue I18n Routing Plugin
 */
interface VueI18nRoutingPluginOptions {
  /**
   * Whether to inject some option APIs style methods into Vue instance
   *
   * @defaultValue `true`
   */
  inject?: boolean
  /**
   * @internal
   */
  __composerExtend?: ComposerExtender
  /**
   * @internal
   */
  __vueI18nExtend?: VueI18nExtender
}

interface ExtendPropertyDescriptors {
  [key: string]: Pick<PropertyDescriptor, 'get'>
}
type ExtendComposerHook = (composer: Composer) => ExtendPropertyDescriptors

type VueI18nExtendOptions = {
  isInitialLocaleSetup: (locale: string) => boolean
  notInitialSetup: Ref<boolean>
  localeCodes: string[]
  localeCookie: ReturnType<typeof getI18nCookie>
  nuxtContext: NuxtApp
  _detectBrowserLanguage: ReturnType<typeof runtimeDetectBrowserLanguage>
  runtimeI18n: ModulePublicRuntimeConfig['i18n']
}
export function extendI18n(i18n: I18n, extendOptions: VueI18nExtendOptions) {
  const scope = effectScope()

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const orgInstall = i18n.install
  // @ts-ignore
  i18n.install = (vue: NuxtApp['vueApp'], ...options: unknown[]) => {
    const pluginOptions: VueI18nRoutingPluginOptions = Object.assign({ inject: true }, options[0])
    pluginOptions.inject ??= true

    pluginOptions.__composerExtend = (c: Composer) => {
      const g = getComposer(i18n)

      c.locales = computed(() => g.locales.value)
      c.localeCodes = computed(() => g.localeCodes.value)
      c.baseUrl = computed(() => g.baseUrl.value)

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

    if (i18n.mode === 'legacy') {
      pluginOptions.__vueI18nExtend = (vueI18n: VueI18n) => {
        extendVueI18n(vueI18n)
        return () => {}
      }
    }

    options[0] = pluginOptions
    Reflect.apply(orgInstall, i18n, [vue, ...options])

    const globalComposer = getComposer(i18n)

    // extend global
    scope.run(() => {
      extendComposer(globalComposer, extendOptions, i18n)
      if (i18n.mode === 'legacy' && isVueI18n(i18n.global)) {
        extendVueI18n(i18n.global)
      }
    })

    // extend vue component instance for Vue 3
    const app = vue

    // prettier-ignore
    const exported = i18n.mode === 'composition'
      ? app.config.globalProperties.$i18n
      // for legacy mode
      : null
    if (exported) {
      extendExportedGlobal(exported, globalComposer)
    }

    if (pluginOptions.inject) {
      const common = initCommonComposableOptions(i18n)
      // extend vue component instance
      vue.mixin({
        methods: {
          getRouteBaseName: wrapComposable(getRouteBaseName, common),
          resolveRoute: wrapComposable(resolveRoute, common),
          localePath: wrapComposable(localePath, common),
          localeRoute: wrapComposable(localeRoute, common),
          localeLocation: wrapComposable(localeLocation, common),
          switchLocalePath: wrapComposable(switchLocalePath, common),
          localeHead: wrapComposable(localeHead, common)
        }
      })
    }

    // dispose when app will be unmounting
    if (app.unmount) {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const unmountApp = app.unmount
      app.unmount = () => {
        scope.stop()
        unmountApp()
      }
    }
  }

  return scope
}

function extendComposer(
  composer: Composer,
  {
    localeCodes,
    isInitialLocaleSetup,
    notInitialSetup,
    localeCookie,
    nuxtContext,
    _detectBrowserLanguage,
    runtimeI18n
  }: VueI18nExtendOptions,
  i18n: I18n
) {
  const route = useRoute()
  const getLocaleFromRoute = createLocaleFromRouteGetter()
  const _locales = ref<string[] | LocaleObject[]>(runtimeI18n.configLocales)
  const _localeCodes = ref<string[]>(localeCodes)
  const _baseUrl = ref<string>('')

  // @ts-ignore
  composer.locales = computed(() => _locales.value)
  composer.localeCodes = computed(() => _localeCodes.value)
  composer.baseUrl = computed(() => _baseUrl.value)

  if (inBrowser) {
    watch(
      composer.locale,
      () => {
        _baseUrl.value = resolveBaseUrl(runtimeI18n.baseUrl!, nuxtContext!)
      },
      { immediate: true }
    )
  } else {
    _baseUrl.value = resolveBaseUrl(runtimeI18n.baseUrl!, nuxtContext!)
  }

  composer.strategy = runtimeI18n.strategy
  composer.localeProperties = computed(
    () => normalizedLocales.find(l => l.code === composer.locale.value) || { code: composer.locale.value }
  )
  composer.setLocale = async (locale: string) => {
    const localeSetup = isInitialLocaleSetup(locale)
    const modified = await loadAndSetLocale(locale, i18n, runtimeI18n, localeSetup)

    if (modified && localeSetup) {
      notInitialSetup.value = false
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setter = (locale: Locale, message: Record<string, any>) => mergeLocaleMessage(i18n, locale, message)
    await loadLocale(locale, localeLoaders, setter)
  }
  composer.differentDomains = runtimeI18n.differentDomains
  composer.defaultLocale = runtimeI18n.defaultLocale
  composer.getBrowserLocale = () => _getBrowserLocale()
  composer.getLocaleCookie = () => _getLocaleCookie(localeCookie, _detectBrowserLanguage, runtimeI18n.defaultLocale)
  composer.setLocaleCookie = (locale: string) => _setLocaleCookie(localeCookie, locale, _detectBrowserLanguage)

  composer.onBeforeLanguageSwitch = (oldLocale, newLocale, initialSetup, context) =>
    nuxtContext.callHook('i18n:beforeLocaleSwitch', { oldLocale, newLocale, initialSetup, context })
  composer.onLanguageSwitched = (oldLocale, newLocale) =>
    nuxtContext.callHook('i18n:localeSwitched', { oldLocale, newLocale })

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
}

function extendPropertyDescriptors(
  composer: Composer,
  exported: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  hook?: ExtendComposerHook
): void {
  const properties: ExtendPropertyDescriptors[] = [
    {
      locales: {
        get: () => composer.locales.value
      },
      localeCodes: {
        get: () => composer.localeCodes.value
      },
      baseUrl: {
        get: () => composer.baseUrl.value
      }
    }
  ]
  hook && properties.push(hook(composer))
  for (const property of properties) {
    for (const [key, descriptor] of Object.entries(property)) {
      Object.defineProperty(exported, key, descriptor)
    }
  }
}

function extendExportedGlobal(exported: ExportedGlobalComposer, g: Composer) {
  function hook(g: Composer): ExtendPropertyDescriptors {
    return {
      strategy: {
        get: () => g.strategy
      },
      localeProperties: {
        get: () => g.localeProperties.value
      },
      setLocale: {
        get: () => async (locale: string) => Reflect.apply(g.setLocale, g, [locale])
      },
      differentDomains: {
        get: () => g.differentDomains
      },
      defaultLocale: {
        get: () => g.defaultLocale
      },
      getBrowserLocale: {
        get: () => () => Reflect.apply(g.getBrowserLocale, g, [])
      },
      getLocaleCookie: {
        get: () => () => Reflect.apply(g.getLocaleCookie, g, [])
      },
      setLocaleCookie: {
        get: () => (locale: string) => Reflect.apply(g.setLocaleCookie, g, [locale])
      },
      onBeforeLanguageSwitch: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        get: () => (oldLocale: string, newLocale: string, initialSetup: boolean, context: NuxtApp) =>
          Reflect.apply(g.onBeforeLanguageSwitch, g, [oldLocale, newLocale, initialSetup, context])
      },
      onLanguageSwitched: {
        get: () => (oldLocale: string, newLocale: string) =>
          Reflect.apply(g.onLanguageSwitched, g, [oldLocale, newLocale])
      },
      finalizePendingLocaleChange: {
        get: () => () => Reflect.apply(g.finalizePendingLocaleChange, g, [])
      },
      waitForPendingLocaleChange: {
        get: () => () => Reflect.apply(g.waitForPendingLocaleChange, g, [])
      }
    }
  }
  extendPropertyDescriptors(g, exported, hook)
}

function extendVueI18n(vueI18n: VueI18n): void {
  const c = getComposer(vueI18n)

  function hook(composer: Composer): ExtendPropertyDescriptors {
    return {
      strategy: {
        get: () => composer.strategy
      },
      localeProperties: {
        get: () => composer.localeProperties.value
      },
      setLocale: {
        get: () => async (locale: string) => Reflect.apply(composer.setLocale, composer, [locale])
      },
      loadLocaleMessages: {
        get: () => async (locale: string) => Reflect.apply(composer.loadLocaleMessages, composer, [locale])
      },
      differentDomains: {
        get: () => composer.differentDomains
      },
      defaultLocale: {
        get: () => composer.defaultLocale
      },
      getBrowserLocale: {
        get: () => () => Reflect.apply(composer.getBrowserLocale, composer, [])
      },
      getLocaleCookie: {
        get: () => () => Reflect.apply(composer.getLocaleCookie, composer, [])
      },
      setLocaleCookie: {
        get: () => (locale: string) => Reflect.apply(composer.setLocaleCookie, composer, [locale])
      },
      onBeforeLanguageSwitch: {
        get:
          () =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (oldLocale: string, newLocale: string, initialSetup: boolean, context: NuxtApp) =>
            Reflect.apply(composer.onBeforeLanguageSwitch, composer, [oldLocale, newLocale, initialSetup, context])
      },
      onLanguageSwitched: {
        get: () => (oldLocale: string, newLocale: string) =>
          Reflect.apply(composer.onLanguageSwitched, composer, [oldLocale, newLocale])
      },
      finalizePendingLocaleChange: {
        get: () => () => Reflect.apply(composer.finalizePendingLocaleChange, composer, [])
      },
      waitForPendingLocaleChange: {
        get: () => () => Reflect.apply(composer.waitForPendingLocaleChange, composer, [])
      }
    }
  }
  extendPropertyDescriptors(c, vueI18n, hook)
}
