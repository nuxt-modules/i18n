import { ref, computed } from 'vue-demi'
import { createI18n } from 'vue-i18n'
import { isEmptyObject } from '@intlify/shared'
import { createLocaleFromRouteGetter } from 'vue-i18n-routing'
import { defineNuxtPlugin } from '#app'
import {
  messages as loadMessages,
  localeCodes,
  nuxtI18nOptions
  // @ts-ignore
} from '#build/i18n.options.mjs'

import type { Composer } from 'vue-i18n'
import type { RouteLocationNormalized } from 'vue-router'
import type { LocaleObject } from 'vue-i18n-routing'

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
  console.log('nuxt.plugin setup', nuxt)

  // TODO: lazy load
  // load messages
  const messages = await loadMessages()
  if (!isEmptyObject(messages)) {
    nuxtI18nOptions.vueI18n.messages = messages
  }
  const initialLocale = nuxtI18nOptions.vueI18n.locale

  // create i18n instance
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    ...nuxtI18nOptions.vueI18n,
    locale: nuxtI18nOptions.defaultLocale
  })

  const global = i18n.global as Composer

  // extends properties & methods
  const _locales = ref<string[] | LocaleObject[]>(nuxtI18nOptions.locales)
  const _localeCodes = ref<string[]>(localeCodes)
  global.locales = computed(() => _locales.value)
  global.localeCodes = computed(() => _localeCodes.value)

  // install vue-i18n
  app.use(i18n)

  // inject i18n global to nuxt
  nuxt.provide('i18n', global)

  if (process.client) {
    // TODO: resolve `addRouteMiddleware`
    // @ts-ignore
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
