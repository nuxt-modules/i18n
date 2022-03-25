import Vue from 'vue'
import { install, ref, computed } from 'vue-demi'
import VueI18n from 'vue-i18n'
import { createI18n } from '@intlify/vue-i18n-bridge'
import { createLocaleFromRouteGetter, resolveBaseUrl, findBrowserLocale } from 'vue-i18n-routing'
import { isEmptyObject } from '@intlify/shared'
import { messages as loadMessages, localeCodes, nuxtI18nOptions } from '#build/i18n.options.mjs'
import { parseAcceptLanguage } from '#build/i18n.utils.mjs'

import type { I18nOptions, Composer } from '@intlify/vue-i18n-bridge'
import type { LocaleObject } from 'vue-i18n-routing'
import type { NuxtI18nInternalOptions } from '#build/i18n.options.mjs'

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
  // console.log('bridge.plugin setup', context)

  const vueI18nOptions = nuxtI18nOptions.vueI18n as I18nOptions
  const nuxtI18nOptionsInternal = nuxtI18nOptions as unknown as Required<NuxtI18nInternalOptions>

  // vue-i18n install to vue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Vue.use(VueI18n as any, { bridge: true }) // TODO: should resolve type errors

  // TODO: lazy load

  // load messages
  const messages = await loadMessages()
  if (!isEmptyObject(messages)) {
    vueI18nOptions.messages = messages
  }
  const initialLocale = vueI18nOptions.locale || 'en-US'

  // create i18n instance with vue-i18n-bridge
  const i18n = createI18n<false>(
    {
      legacy: false,
      globalInjection: true,
      ...vueI18nOptions,
      locale: nuxtI18nOptions.defaultLocale
    },
    VueI18n
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Vue.use(i18n as any) // TODO: should resolve type errors

  const global = i18n.global as Composer

  // extends properties & methods
  const _locales = ref<string[] | LocaleObject[]>(nuxtI18nOptions.locales)
  const _localeCodes = ref<string[]>(localeCodes)
  const _localeProperties = ref<LocaleObject>(
    nuxtI18nOptionsInternal.__normalizedLocales.find((l: LocaleObject) => l.code === global.locale.value) || {
      code: global.locale.value
    }
  )
  const _getBrowserLocale = (): string | undefined => {
    if (process.client && typeof navigator !== 'undefined' && navigator.languages) {
      // get browser language either from navigator if running on client side, or from the headers
      return findBrowserLocale(nuxtI18nOptionsInternal.__normalizedLocales, navigator.languages as string[])
    } else if (context.req && typeof context.req.headers['accept-language'] !== 'undefined') {
      return findBrowserLocale(
        nuxtI18nOptionsInternal.__normalizedLocales,
        parseAcceptLanguage(context.req.headers['accept-language'])
      )
    } else {
      return undefined
    }
  }

  global.locales = computed(() => _locales.value)
  global.localeCodes = computed(() => _localeCodes.value)
  global.localeProperties = computed(() => _localeProperties.value)
  global.getBrowserLocale = _getBrowserLocale
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
  console.log('getBrowserLocale', global.getBrowserLocale())

  if (process.client) {
    // @ts-ignore TODO: should resolve missing
    addRouteMiddleware(
      'locale-changing',
      // @ts-ignore
      (to, from) => {
        const currentLocale = global.locale.value
        const finalLocale = getLocaleFromRoute(to) || nuxtI18nOptions.defaultLocale || initialLocale
        if (currentLocale !== finalLocale) {
          global.locale.value = finalLocale
        }
      },
      { global: true }
    )
  } else {
    // @ts-ignore
    // TODO: query or http status
    const finalLocale = getLocaleFromRoute(context.route) || nuxtI18nOptions.defaultLocale || initialLocale
    global.locale.value = finalLocale
  }
}
