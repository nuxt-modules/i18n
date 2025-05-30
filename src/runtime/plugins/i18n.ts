import { computed, ref, watch } from 'vue'
import { createI18n } from 'vue-i18n'
import { defineNuxtPlugin, prerenderRoutes, useNuxtApp } from '#imports'
import { localeCodes, normalizedLocales } from '#build/i18n.options.mjs'
import { loadAndSetLocale, navigate, createNuxtI18nDev, createComposableContext } from '../utils'
import { extendI18n } from '../routing/i18n'
import { getI18nTarget } from '../compatibility'
import { localeHead, _useLocaleHead } from '../routing/head'
import { useLocalePath, useLocaleRoute, useRouteBaseName, useSwitchLocalePath } from '../composables'
import { getDefaultLocaleForDomain, setupMultiDomainLocales } from '../domain'
import { createLocaleConfigs } from '../shared/locales'
import { setupVueI18nOptions } from '../shared/vue-i18n'
import { createNuxtI18nContext, useLocaleConfigs, useNuxtI18nContext, type NuxtI18nContext } from '../context'

import type { I18nOptions, Composer, TranslateOptions } from 'vue-i18n'
import type { I18nPublicRuntimeConfig, I18nHeadOptions } from '#internal-i18n-types'
import type { H3EventContext } from 'h3'

export default defineNuxtPlugin({
  name: 'i18n:plugin',
  parallel: __PARALLEL_PLUGIN__,
  async setup(_nuxt) {
    Object.defineProperty(_nuxt.versions, 'nuxtI18n', { get: () => __NUXT_I18N_VERSION__ })

    const nuxt = useNuxtApp()
    const runtimeI18n = nuxt.$config.public.i18n as I18nPublicRuntimeConfig
    const defaultLocale: string = getDefaultLocaleForDomain() || runtimeI18n.defaultLocale || ''
    if (__MULTI_DOMAIN_LOCALES__) {
      setupMultiDomainLocales(defaultLocale)
    }

    const vueI18nOptions: I18nOptions = await setupVueI18nOptions(defaultLocale)

    if (import.meta.server) {
      const serverLocaleConfigs = useLocaleConfigs()
      const localeConfigs = createLocaleConfigs(vueI18nOptions.fallbackLocale!)
      serverLocaleConfigs.value = localeConfigs
      if (nuxt.ssrContext?.event.context.nuxtI18n) {
        nuxt.ssrContext.event.context.nuxtI18n.localeConfigs = localeConfigs
      }
    }

    prerenderRoutes(localeCodes.map(locale => `/_i18n/${locale}/messages.json`))

    // create i18n instance
    const i18n = createI18n(vueI18nOptions)

    nuxt._nuxtI18nCtx = createNuxtI18nContext(nuxt, i18n, defaultLocale)
    const ctx = useNuxtI18nContext(nuxt)

    nuxt._nuxtI18n = createComposableContext()

    if (__I18N_STRIP_UNUSED__ && import.meta.server && nuxt.ssrContext?.event.context.nuxtI18n) {
      wrapTranslationFunctions(ctx, nuxt.ssrContext?.event.context.nuxtI18n)
    }

    // HMR helper functionality
    if (import.meta.dev) {
      nuxt._nuxtI18nDev = createNuxtI18nDev()
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
          () => normalizedLocales.find(l => l.code === composer.locale.value) || { code: composer.locale.value }
        )
        composer.setLocale = async (locale: string) => {
          await loadAndSetLocale(locale)
          await nuxt.runWithContext(() => navigate(nuxt.$router.currentRoute.value, locale))
        }
        composer.loadLocaleMessages = ctx.loadMessages

        composer.differentDomains = __DIFFERENT_DOMAINS__
        composer.defaultLocale = defaultLocale

        composer.getBrowserLocale = ctx.getBrowserLocale
        composer.getLocaleCookie = ctx.getCookieLocale
        composer.setLocaleCookie = ctx.setCookieLocale

        composer.finalizePendingLocaleChange = async () => {
          if (!i18n.__pendingLocale) return
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
          ['setLocale', () => async (locale: string) => Reflect.apply(c.setLocale, c, [locale])],
          ['loadLocaleMessages', () => async (locale: string) => Reflect.apply(c.loadLocaleMessages, c, [locale])],
          ['differentDomains', () => __DIFFERENT_DOMAINS__],
          ['defaultLocale', () => c.defaultLocale],
          ['getBrowserLocale', () => () => Reflect.apply(c.getBrowserLocale, c, [])],
          ['getLocaleCookie', () => () => Reflect.apply(c.getLocaleCookie, c, [])],
          ['setLocaleCookie', () => (locale: string) => Reflect.apply(c.setLocaleCookie, c, [locale])],
          ['finalizePendingLocaleChange', () => () => Reflect.apply(c.finalizePendingLocaleChange, c, [])],
          ['waitForPendingLocaleChange', () => () => Reflect.apply(c.waitForPendingLocaleChange, c, [])]
        ]

        for (const [key, get] of props) {
          Object.defineProperty(instance, key, { get })
        }
      }
    })

    nuxt.vueApp.use(i18n)

    /**
     * We inject `i18n.global` to **nuxt app instance only** as vue-i18n has already been injected into vue
     * from https://github.com/nuxt/nuxt/blob/a995f724eadaa06d5443b188879ac18dfe73de2e/packages/nuxt/src/app/nuxt.ts#L295-L299
     */
    Object.defineProperty(nuxt, '$i18n', { get: () => getI18nTarget(i18n) })

    nuxt.provide('localeHead', (options: I18nHeadOptions) => localeHead(nuxt._nuxtI18n, options))
    nuxt.provide('localePath', useLocalePath())
    nuxt.provide('localeRoute', useLocaleRoute())
    nuxt.provide('routeBaseName', useRouteBaseName())
    nuxt.provide('getRouteBaseName', useRouteBaseName())
    nuxt.provide('switchLocalePath', useSwitchLocalePath())

    if (__I18N_STRICT_SEO__) {
      // enable head tag management after most of the i18n setup is done
      nuxt.hook(import.meta.server ? 'app:rendered' : 'app:mounted', () => {
        _useLocaleHead(nuxt._nuxtI18n, { dir: true, lang: true, seo: true })
      })
    }
  }
})

/**
 * Wrap translation functions to track translation keys used during SSR
 */
function wrapTranslationFunctions(ctx: NuxtI18nContext, serverI18n: H3EventContext['nuxtI18n']) {
  const i18n = ctx.vueI18n.global
  const originalT = i18n.t.bind(i18n)
  type TParams = Parameters<typeof originalT>
  i18n.t = (
    key: string,
    listOrNamed?: string | number | unknown[] | Record<string, unknown>,
    opts?: TranslateOptions<string> | number | string
  ) => {
    const locale = ((typeof opts === 'object' && opts?.locale) || ctx.getLocale()) as string
    serverI18n?.trackKey(key, locale)
    // @ts-expect-error type mismatch
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return originalT(key, listOrNamed as TParams[1], opts)
  }

  const originalTe = i18n.te.bind(i18n)
  i18n.te = (key, locale) => {
    serverI18n?.trackKey(key, locale || ctx.getLocale())
    return originalTe(key, locale)
  }

  const originalTm = i18n.tm.bind(i18n)
  i18n.tm = key => {
    serverI18n?.trackKey(key, ctx.getLocale())
    return originalTm(key)
  }
}
