import { computed, isRef, ref, unref, watch } from 'vue'
import { createI18n } from 'vue-i18n'
import { defineNuxtPlugin, addRouteMiddleware, defineNuxtRouteMiddleware, useNuxtApp } from '#imports'
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
import { createLogger } from 'virtual:nuxt-i18n-logger'

import type { NuxtI18nPluginInjections } from '../injections'
import type { Locale, I18nOptions, Composer } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { LocaleObject } from '#internal-i18n-types'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { CompatRoute } from '../types'

// from https://github.com/nuxt/nuxt/blob/2466af53b0331cdb8b17c2c3b08675c5985deaf3/packages/nuxt/src/core/templates.ts#L152
type Decorate<T extends Record<string, unknown>> = { [K in keyof T as K extends string ? `$${K}` : never]: T[K] }

// TODO: use @nuxt/module-builder to stub/prepare types
declare module '#app' {
  interface NuxtApp extends Decorate<NuxtI18nPluginInjections> {}
}

// `NuxtI18nPluginInjections` should not have properties prefixed with `$`
export default defineNuxtPlugin<NuxtI18nPluginInjections>({
  name: 'i18n:plugin',
  parallel: parallelPlugin,
  async setup(nuxt) {
    const logger = /*#__PURE__*/ createLogger('plugin:i18n')
    const nuxtApp = nuxt as unknown as NuxtApp
    const currentRoute = nuxtApp.$router.currentRoute

    const defaultLocaleDomain = getDefaultLocaleForDomain(nuxtApp)
    setupMultiDomainLocales(nuxtApp, defaultLocaleDomain)

    // Fresh copy per request to prevent reusing mutated options
    const runtimeI18n = {
      ...(nuxtApp.$config.public.i18n as I18nPublicRuntimeConfig),
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

    const getRouteLocale = createLocaleFromRouteGetter()
    const localeCookie = getI18nCookie()

    // create i18n instance
    const i18n = createI18n(vueI18nOptions)

    let firstAccess = true

    // extend i18n instance
    extendI18n(i18n, {
      extendComposer(composer) {
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
              _baseUrl.value = resolveBaseUrl(runtimeI18n.baseUrl!, nuxtApp)
            },
            { immediate: true }
          )
        } else {
          _baseUrl.value = resolveBaseUrl(runtimeI18n.baseUrl!, nuxtApp)
        }

        composer.strategy = runtimeI18n.strategy
        composer.localeProperties = computed(
          () => normalizedLocales.find(l => l.code === composer.locale.value) || { code: composer.locale.value }
        )
        composer.setLocale = async (locale: string) => {
          await loadAndSetLocale(locale, runtimeI18n, firstAccess)

          if (composer.strategy === 'no_prefix' || !hasPages) {
            await composer.loadLocaleMessages(locale)
            composer.__setLocale(locale)
            return
          }

          const route = currentRoute.value
          const redirectPath = await nuxtApp.runWithContext(() =>
            detectRedirect({ to: route, locale, routeLocale: getRouteLocale(route) })
          )

          __DEBUG__ && logger.log('redirectPath on setLocale', redirectPath)

          await nuxtApp.runWithContext(() =>
            navigate({ nuxtApp, i18n, redirectPath, locale, route }, { enableNavigate: true })
          )
        }
        composer.loadLocaleMessages = async (locale: string) => {
          await loadLocale(locale, localeLoaders, composer.mergeLocaleMessage.bind(composer))
        }
        composer.differentDomains = runtimeI18n.differentDomains
        composer.defaultLocale = runtimeI18n.defaultLocale
        composer.getBrowserLocale = () => getBrowserLocale()
        composer.__setLocale = (locale: string) => {
          if (isRef(composer.locale)) {
            composer.locale.value = locale
          } else {
            ;(composer.locale as string) = locale
          }
        }
        composer.getLocaleCookie = () => getLocaleCookie(localeCookie, _detectBrowserLanguage, composer.defaultLocale)
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
          composer.__setLocale(i18n.__pendingLocale)
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
        const props: [keyof Composer, PropertyDescriptor['get']][] = [
          ['locales', () => c.locales.value],
          ['localeCodes', () => c.localeCodes.value],
          ['baseUrl', () => c.baseUrl.value],
          ['strategy', () => c.strategy],
          ['localeProperties', () => c.localeProperties.value],
          ['__setLocale', () => (locale: string) => Reflect.apply(c.__setLocale, c, [locale])],
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

    nuxt.vueApp.use(i18n) // TODO: should implement `{ inject: false } via `nuxtjs/i18n` configuration

    // inject for nuxt helpers
    injectNuxtHelpers(nuxtApp, i18n)

    async function handleRouteDetect(to: CompatRoute) {
      let detected = detectLocale(
        to,
        getRouteLocale(to),
        unref(nuxtApp.$i18n.locale),
        {
          ssg: isSSG && firstAccess && nuxtApp.$i18n.strategy === 'no_prefix' ? 'ssg_ignore' : 'normal',
          firstAccess,
          localeCookie: nuxtApp.$i18n.getLocaleCookie()
        },
        runtimeI18n
      )
      __DEBUG__ && logger.log('detect locale', detected)

      if (firstAccess) {
        nuxtApp.$i18n.__setLocale(detected)
        await nuxtApp.$i18n.loadLocaleMessages(detected)
      }

      const modified = await nuxtApp.runWithContext(() => loadAndSetLocale(detected, runtimeI18n, firstAccess))
      if (modified) {
        detected = unref(nuxtApp.$i18n.locale)
      }

      return detected
    }

    // router is enabled and project has pages
    if (!hasPages) {
      await handleRouteDetect(currentRoute.value)
      return
    }

    addRouteMiddleware(
      'locale-changing',
      defineNuxtRouteMiddleware(async (to, from) => {
        __DEBUG__ && logger.log('locale-changing middleware', to, from)

        const locale = await nuxtApp.runWithContext(() => handleRouteDetect(to))

        const redirectPath = await nuxtApp.runWithContext(() =>
          detectRedirect({ to, from, locale, routeLocale: getRouteLocale(to) }, true)
        )

        firstAccess = false

        __DEBUG__ && logger.log('redirectPath on locale-changing middleware', redirectPath)

        return await nuxtApp.runWithContext(() => navigate({ nuxtApp, i18n, redirectPath, locale, route: to }))
      }),
      { global: true }
    )
  }
})
