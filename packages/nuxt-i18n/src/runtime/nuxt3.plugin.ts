import { ref, computed } from 'vue-demi'
import { createI18n } from '@intlify/vue-i18n-bridge'
import { isEmptyObject } from '@intlify/shared'
import { createLocaleFromRouteGetter, resolveBaseUrl } from 'vue-i18n-routing'
import { defineNuxtPlugin, addRouteMiddleware } from '#app'
import { messages as loadMessages, localeCodes, nuxtI18nOptions } from '#build/i18n.options.mjs'
import { getBrowserLocale } from '#build/i18n.utils.mjs'

import type { Composer, I18nOptions } from '@intlify/vue-i18n-bridge'
import type { RouteLocationNormalized } from 'vue-router'
import type { LocaleObject } from 'vue-i18n-routing'
import type { NuxtI18nInternalOptions } from '#build/i18n.options.mjs'

const getLocaleFromRoute = createLocaleFromRouteGetter(
  localeCodes,
  nuxtI18nOptions.routesNameSeparator,
  nuxtI18nOptions.defaultLocaleRouteNameSuffix
)

// @ts-ignore TODO:
export default defineNuxtPlugin(async nuxt => {
  const { vueApp: app } = nuxt

  // console.log('load options', loadMessages(), localeCodes, nuxtI18nOptions, Vue.version)
  // @ts-ignore
  // console.log('nuxt.plugin setup', nuxt)
  // console.log('accept-lang', useRequestHeaders(['accept-language']))
  const vueI18nOptions = nuxtI18nOptions.vueI18n as I18nOptions
  const nuxtI18nOptionsInternal = nuxtI18nOptions as unknown as Required<NuxtI18nInternalOptions>

  // TODO: lazy load
  // load messages
  const messages = await loadMessages()
  if (!isEmptyObject(messages)) {
    vueI18nOptions.messages = messages
  }
  const initialLocale = vueI18nOptions.locale || 'en-US'

  // create i18n instance
  const i18n = createI18n<false>({
    legacy: false,
    globalInjection: true,
    ...vueI18nOptions,
    locale: nuxtI18nOptions.defaultLocale
  })

  const global = i18n.global as Composer

  // extends properties & methods
  const _locales = ref<string[] | LocaleObject[]>(nuxtI18nOptions.locales)
  const _localeCodes = ref<string[]>(localeCodes)
  const _localeProperties = ref<LocaleObject>(
    nuxtI18nOptionsInternal.__normalizedLocales.find((l: LocaleObject) => l.code === global.locale.value) || {
      code: global.locale.value
    }
  )

  global.locales = computed(() => _locales.value)
  global.localeCodes = computed(() => _localeCodes.value)
  global.localeProperties = computed(() => _localeProperties.value)
  global.getBrowserLocale = () => getBrowserLocale(nuxtI18nOptionsInternal)
  global.__baseUrl = resolveBaseUrl(nuxtI18nOptions.baseUrl, {})

  // install vue-i18n
  app.use(i18n as any) // TODO: should resolve type

  // inject i18n global to nuxt
  // nuxt.provide('i18n', global)

  if (process.client) {
    addRouteMiddleware(
      'locale-changing',
      (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
        const currentLocale = global.locale.value
        const finalLocale = getLocaleFromRoute(to) || nuxtI18nOptions.defaultLocale || initialLocale
        if (currentLocale !== finalLocale) {
          global.locale.value = finalLocale
        }
      },
      { global: true }
    )
  } else {
    // TODO: query or http status
    const finalLocale = getLocaleFromRoute(nuxt.ssrContext!.url) || nuxtI18nOptions.defaultLocale || initialLocale
    global.locale.value = finalLocale
  }
})
