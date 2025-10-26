import { computed, ref, watch } from 'vue'
import { createI18n } from 'vue-i18n'
import { defineNuxtPlugin, prerenderRoutes, useNuxtApp, useRequestEvent, useRequestURL } from '#imports'
import { localeCodes, normalizedLocales } from '#build/i18n-options.mjs'
import { loadAndSetLocale, navigate } from '../utils'
import { extendI18n } from '../routing/i18n'
import { getI18nTarget } from '../compatibility'
import { _useLocaleHead, localeHead } from '../routing/head'
import { useLocalePath, useLocaleRoute, useRouteBaseName, useSwitchLocalePath } from '../composables'
import { createLocaleConfigs, getDefaultLocaleForDomain, resolveSupportedLocale } from '../shared/locales'
import { setupVueI18nOptions } from '../shared/vue-i18n'
import { type NuxtI18nContext, createNuxtI18nContext, useLocaleConfigs } from '../context'
import { useI18nDetection, useRuntimeI18n } from '../shared/utils'
import { useDetectors } from '../shared/detection'
import { setupMultiDomainLocales } from '../routing/domain'

import type { Composer, TranslateOptions } from 'vue-i18n'
import type { I18nHeadOptions } from '#internal-i18n-types'

export default defineNuxtPlugin({
  name: 'i18n:plugin',
  parallel: __PARALLEL_PLUGIN__,
  async setup(_nuxt) {
    Object.defineProperty(_nuxt.versions, 'nuxtI18n', { get: () => __NUXT_I18N_VERSION__ })

    // @ts-expect-error untyped internal id parameter
    const nuxt = useNuxtApp(_nuxt._id)
    const runtimeI18n = useRuntimeI18n(nuxt)
    const preloadedOptions = nuxt.ssrContext?.event?.context?.nuxtI18n?.vueI18nOptions
    const _defaultLocale
      = getDefaultLocaleForDomain(useRequestURL({ xForwardedHost: true }).host) || runtimeI18n.defaultLocale || ''
    const optionsI18n = preloadedOptions || (await setupVueI18nOptions(_defaultLocale))

    const localeConfigs = useLocaleConfigs()
    if (import.meta.server) {
      localeConfigs.value = useRequestEvent()!.context.nuxtI18n?.localeConfigs || {}
    } else {
      // fallback when server is disabled
      localeConfigs.value ??= createLocaleConfigs(optionsI18n.fallbackLocale)
    }

    if (__MULTI_DOMAIN_LOCALES__) {
      setupMultiDomainLocales(optionsI18n.defaultLocale)
    }

    prerenderRoutes(localeCodes.map(locale => `${__I18N_SERVER_ROUTE__}/${locale}/messages.json`))

    // create i18n instance
    const i18n = createI18n(optionsI18n)
    const detectors = useDetectors(useRequestEvent(nuxt), useI18nDetection(nuxt), nuxt)

    const ctx = createNuxtI18nContext(nuxt, i18n, optionsI18n.defaultLocale)
    nuxt._nuxtI18n = ctx

    if (__I18N_STRIP_UNUSED__ && import.meta.server) {
      wrapTranslationFunctions(ctx)
    }

    // extend i18n instance
    extendI18n(i18n, {
      extendComposer(composer) {
        composer.locales = computed(() => runtimeI18n.locales)
        composer.localeCodes = computed(() => localeCodes)

        const _baseUrl = ref(ctx.getBaseUrl())
        composer.baseUrl = computed(() => _baseUrl.value)

        if (import.meta.client) {
          watch(composer.locale, () => (_baseUrl.value = ctx.getBaseUrl()))
        }

        composer.strategy = __I18N_STRATEGY__
        composer.localeProperties = computed(
          () => normalizedLocales.find(l => l.code === composer.locale.value) || { code: composer.locale.value },
        )
        composer.setLocale = async (locale: string) => {
          await loadAndSetLocale(nuxt, locale)
          await nuxt.runWithContext(() => navigate(nuxt, nuxt.$router.currentRoute.value, locale))
        }
        composer.loadLocaleMessages = ctx.loadMessages

        composer.differentDomains = __DIFFERENT_DOMAINS__
        composer.defaultLocale = optionsI18n.defaultLocale

        composer.getBrowserLocale = () =>
          import.meta.client
            ? resolveSupportedLocale(detectors.navigator())
            : resolveSupportedLocale(detectors.header())

        composer.getLocaleCookie = () => resolveSupportedLocale(detectors.cookie())
        composer.setLocaleCookie = ctx.setCookieLocale

        composer.finalizePendingLocaleChange = async () => {
          if (!i18n.__pendingLocale) { return }
          await i18n.__resolvePendingLocalePromise?.()
        }
        composer.waitForPendingLocaleChange = async () => {
          await i18n?.__pendingLocalePromise
        }
      },
      extendComposerInstance(instance, c) {
        // Set the extended properties on local scope composer instance
        const props: [keyof Composer, PropertyDescriptor['get']][] = [
          ['locales', () => c.locales],
          ['localeCodes', () => c.localeCodes],
          ['baseUrl', () => c.baseUrl],
          ['strategy', () => __I18N_STRATEGY__],
          ['localeProperties', () => c.localeProperties],
          ['setLocale', () => (locale: string) => Reflect.apply(c.setLocale, c, [locale])],
          ['loadLocaleMessages', () => (locale: string) => Reflect.apply(c.loadLocaleMessages, c, [locale])],
          ['differentDomains', () => __DIFFERENT_DOMAINS__],
          ['defaultLocale', () => c.defaultLocale],
          ['getBrowserLocale', () => () => Reflect.apply(c.getBrowserLocale, c, [])],
          ['getLocaleCookie', () => () => Reflect.apply(c.getLocaleCookie, c, [])],
          ['setLocaleCookie', () => (locale: string) => Reflect.apply(c.setLocaleCookie, c, [locale])],
          ['finalizePendingLocaleChange', () => () => Reflect.apply(c.finalizePendingLocaleChange, c, [])],
          ['waitForPendingLocaleChange', () => () => Reflect.apply(c.waitForPendingLocaleChange, c, [])],
        ]

        for (const [key, get] of props) {
          Object.defineProperty(instance, key, { get })
        }
      },
    })

    nuxt.vueApp.use(i18n)

    /**
     * We inject `i18n.global` to **nuxt app instance only** as vue-i18n has already been injected into vue
     * from https://github.com/nuxt/nuxt/blob/a995f724eadaa06d5443b188879ac18dfe73de2e/packages/nuxt/src/app/nuxt.ts#L295-L299
     */
    Object.defineProperty(nuxt, '$i18n', { get: () => getI18nTarget(i18n) })

    nuxt.provide('localeHead', (options: I18nHeadOptions) => localeHead(nuxt._nuxtI18n.composableCtx, options))
    nuxt.provide('localePath', useLocalePath(nuxt))
    nuxt.provide('localeRoute', useLocaleRoute(nuxt))
    nuxt.provide('routeBaseName', useRouteBaseName(nuxt))
    nuxt.provide('getRouteBaseName', useRouteBaseName(nuxt))
    nuxt.provide('switchLocalePath', useSwitchLocalePath(nuxt))

    if (__I18N_STRICT_SEO__) {
      // enable head tag management after most of the i18n setup is done
      nuxt.hook(import.meta.server ? 'app:rendered' : 'app:mounted', () => {
        _useLocaleHead(nuxt._nuxtI18n.composableCtx, { dir: true, lang: true, seo: true })
      })
    }
  },
})

/**
 * Wrap translation functions to track translation keys used during SSR
 */
function wrapTranslationFunctions(ctx: NuxtI18nContext, serverI18n = useRequestEvent()?.context?.nuxtI18n) {
  if (!serverI18n) { return }

  const i18n = ctx.vueI18n.global
  const originalT = i18n.t.bind(i18n)
  type TParams = Parameters<typeof originalT>
  i18n.t = (
    key: string,
    listOrNamed?: string | number | unknown[] | Record<string, unknown>,
    opts?: TranslateOptions<string> | number | string,
  ) => {
    const locale = ((typeof opts === 'object' && opts?.locale) || ctx.getLocale()) as string
    serverI18n?.trackKey(key, locale)
    // @ts-expect-error type mismatch

    return originalT(key, listOrNamed as TParams[1], opts)
  }

  const originalTe = i18n.te.bind(i18n)
  i18n.te = (key, locale) => {
    serverI18n?.trackKey(key, locale || ctx.getLocale())
    return originalTe(key, locale)
  }

  const originalTm = i18n.tm.bind(i18n)
  i18n.tm = (key) => {
    serverI18n?.trackKey(key, ctx.getLocale())
    return originalTm(key)
  }
}
