import Vue from 'vue'
import { install, ref, computed } from 'vue-demi'
import VueI18n from 'vue-i18n'
import { createI18n } from 'vue-i18n-bridge'
import { createLocaleFromRouteGetter, resolveBaseUrl } from 'vue-i18n-routing'
import { isEmptyObject } from '@intlify/shared'
import {
  messages as loadMessages,
  localeCodes,
  nuxtI18nOptions
  // @ts-ignore
} from '#build/i18n.options.mjs'

import type { Composer } from 'vue-i18n-bridge'
import { LocaleObject } from 'vue-i18n-routing'

// FIXME: why do we install the below ?
install()

const getLocaleFromRoute = createLocaleFromRouteGetter(
  localeCodes,
  nuxtI18nOptions.routesNameSeparator,
  nuxtI18nOptions.defaultLocaleRouteNameSuffix
)

// @ts-ignore
export default async function (context, inject) {
  // @ts-ignore
  // console.log('load options', loadMessages(), localeCodes, nuxtI18nOptions)
  console.log('bridge.plugin setup', context)

  // vue-i18n install to vue
  Vue.use(VueI18n, { bridge: true })

  // TODO: lazy load

  // load messages
  const messages = await loadMessages()
  if (!isEmptyObject(messages)) {
    nuxtI18nOptions.vueI18n.messages = messages
  }
  const initialLocale = nuxtI18nOptions.vueI18n.locale

  // create i18n instance with vue-i18n-bridge
  const i18n = createI18n(
    {
      legacy: false,
      globalInjection: true,
      ...nuxtI18nOptions.vueI18n,
      locale: nuxtI18nOptions.defaultLocale
    },
    VueI18n
  )
  Vue.use(i18n)

  const global = i18n.global as Composer

  // extends properties & methods
  const _locales = ref<string[] | LocaleObject[]>(nuxtI18nOptions.locales)
  const _localeCodes = ref<string[]>(localeCodes)
  const _localeProperties = ref<LocaleObject>(
    nuxtI18nOptions.__normalizedLocales.find((l: LocaleObject) => l.code === global.locale.value) || {
      code: global.locale.value
    }
  )
  global.locales = computed(() => _locales.value)
  global.localeCodes = computed(() => _localeCodes.value)
  global.localeProperties = computed(() => _localeProperties.value)
  global.__baseUrl = resolveBaseUrl(nuxtI18nOptions.baseUrl, {})

  // inject i18n global to nuxt
  inject('i18n', global)
  context.app.i18n = global

  // FIXME: inject
  //  workaround for cannot extend to Vue.prototype on client-side ...
  //  We need to find out why we can't do that on the client-side.
  //  related issue: https://github.com/nuxt/framework/issues/2000
  if (i18n.mode === 'composition' && process.client) {
    ;['t', 'd', 'n'].forEach(key =>
      // @ts-ignore
      inject(key, (...args: unknown[]) => Reflect.apply(composer[key], composer, [...args]))
    )
  }

  if (process.client) {
    // TODO: if `addRouteMiddleware` is supported, switch to it!
    //   https://github.com/nuxt/framework/pull/3193
    /*
    addRouteMiddleware(
      'locale-changing',
      (to, from) => {
        const currentLocale = global.locale.value
        const finalLocale = getLocaleFromRoute(to) || nuxtI18nOptions.defaultLocale || initialLocale
        if (currentLocale !== finalLocale) {
          global.locale.value = finalLocale
        }
      },
      { global: true }
    )
    */
    // @ts-ignore
    context.app.router.beforeEach(async (to, from, next) => {
      const currentLocale = global.locale.value
      const finalLocale = getLocaleFromRoute(to) || nuxtI18nOptions.defaultLocale || initialLocale
      if (currentLocale !== finalLocale) {
        global.locale.value = finalLocale
      }
      next()
    })
  } else {
    // @ts-ignore
    // TODO: query or http status
    const finalLocale = getLocaleFromRoute(context.route) || nuxtI18nOptions.defaultLocale || initialLocale
    global.locale.value = finalLocale
  }
}
