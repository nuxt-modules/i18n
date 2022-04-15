import Vue from 'vue'
import { ref, computed } from 'vue-demi'
import VueI18n from 'vue-i18n'
import { createI18n } from '@intlify/vue-i18n-bridge'
import {
  createLocaleFromRouteGetter,
  extendI18n,
  registerGlobalOptions,
  getRouteBaseName,
  localePath,
  localeLocation,
  localeRoute,
  switchLocalePath,
  localeHead
} from 'vue-i18n-routing'
import { isEmptyObject } from '@intlify/shared'
import { castToVueI18n } from '@intlify/vue-i18n-bridge'
import { defineNuxtPlugin, useRouter, addRouteMiddleware } from '#app'
import { messages as loadMessages, localeCodes, nuxtI18nOptions } from '#build/i18n.options.mjs'
import { loadAndSetLocale } from '#build/i18n.utils.mjs'
import { getBrowserLocale } from '#build/i18n.legacy.mjs'

import type { I18nOptions, Composer } from '@intlify/vue-i18n-bridge'
import type { LocaleObject, ExtendProperyDescripters } from 'vue-i18n-routing'
import type { NuxtI18nInternalOptions } from '#build/i18n.options.mjs'

const getLocaleFromRoute = createLocaleFromRouteGetter(
  localeCodes,
  nuxtI18nOptions.routesNameSeparator,
  nuxtI18nOptions.defaultLocaleRouteNameSuffix
)

export default defineNuxtPlugin(async nuxt => {
  const router = useRouter()

  const vueI18nOptions = nuxtI18nOptions.vueI18n as I18nOptions
  const nuxtI18nOptionsInternal = nuxtI18nOptions as unknown as Required<NuxtI18nInternalOptions>

  // register nuxt/i18n options as global
  // so global options is reffered by `vue-i18n-routing`
  registerGlobalOptions(router, nuxtI18nOptions)

  // TODO: lazy load

  // load messages
  const messages = await loadMessages()
  if (!isEmptyObject(messages)) {
    vueI18nOptions.messages = messages
  }
  const initialLocale = vueI18nOptions.locale || 'en-US'

  // install legacy vue-i18n to vue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Vue.use(VueI18n as any, { bridge: true })

  // create an i18n instance
  const i18n = createI18n(
    {
      ...vueI18nOptions,
      locale: nuxtI18nOptions.defaultLocale
    },
    VueI18n
  )

  // extend i18n instance
  extendI18n(i18n, {
    locales: nuxtI18nOptions.locales,
    localeCodes,
    baseUrl: nuxtI18nOptions.baseUrl,
    hooks: {
      onExtendComposer(composer: Composer) {
        const _localeProperties = ref<LocaleObject>(
          nuxtI18nOptionsInternal.__normalizedLocales.find((l: LocaleObject) => l.code === composer.locale.value) || {
            code: composer.locale.value
          }
        )
        composer.localeProperties = computed(() => _localeProperties.value)
        composer.setLocale = (locale: string) => loadAndSetLocale(locale, i18n)
        composer.getBrowserLocale = () => getBrowserLocale(nuxtI18nOptionsInternal, nuxt.ssrContext)
      },
      onExtendExportedGlobal(global: Composer): ExtendProperyDescripters {
        return {
          localeProperties: {
            get() {
              return global.localeProperties.value
            }
          },
          getBrowserLocale: {
            get() {
              return () => Reflect.apply(global.getBrowserLocale, global, [])
            }
          }
        }
      },
      onExtendVueI18n(composer: Composer): ExtendProperyDescripters {
        return {
          localeProperties: {
            get() {
              return composer.localeProperties.value
            }
          },
          getBrowserLocale: {
            get() {
              return () => Reflect.apply(composer.getBrowserLocale, composer, [])
            }
          }
        }
      }
    }
  })

  // TODO: should implement `{ inject: boolean }
  // install vue-i18n to vue
  Vue.use(castToVueI18n(i18n))

  // support for nuxt legacy (compatibility)
  const legacyNuxtContext = nuxt.nuxt2Context
  if (legacyNuxtContext) {
    const { app, store } = legacyNuxtContext
    legacyNuxtContext.i18n = i18n.global as unknown as Composer // TODO: should resolve type!
    app.i18n = i18n.global as unknown as Composer // TODO: should resolve type!
    app.getRouteBaseName = legacyNuxtContext.getRouteBaseName = proxyNuxtLegacy(legacyNuxtContext, getRouteBaseName)
    app.localePath = legacyNuxtContext.localePath = proxyNuxtLegacy(legacyNuxtContext, localePath)
    app.localeRoute = legacyNuxtContext.localeRoute = proxyNuxtLegacy(legacyNuxtContext, localeRoute)
    app.localeLocation = legacyNuxtContext.localeLocation = proxyNuxtLegacy(legacyNuxtContext, localeLocation)
    app.switchLocalePath = legacyNuxtContext.switchLocalePath = proxyNuxtLegacy(legacyNuxtContext, switchLocalePath)
    app.localeHead = legacyNuxtContext.localeHead = proxyNuxtLegacy(legacyNuxtContext, localeHead)
    if (store) {
      // TODO: should implement for vuex and pinia
    }
  }
  console.log('nuxt legacy context', legacyNuxtContext)

  // support compatible legacy nuxt/i18n API
  // TODO: `this` should annotate with `Vue`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nuxt.provide('nuxtI18nHead', function (this: any) {
    return Reflect.apply(
      localeHead,
      {
        getRouteBaseName: this.getRouteBaseName,
        localePath: this.localePath,
        localeRoute: this.localeRoute,
        localeLocation: this.localeLocation,
        resolveRoute: this.resolveRoute,
        switchLocalePath: this.switchLocalePath,
        localeHead: this.localeHead,
        i18n: this.$i18n,
        route: this.$route,
        router: this.$router
      },
      // eslint-disable-next-line prefer-rest-params
      arguments
    )
  })

  if (process.client) {
    addRouteMiddleware(
      'locale-changing',
      (to, from) => {
        const finalLocale = getLocaleFromRoute(to) || nuxtI18nOptions.defaultLocale || initialLocale
        loadAndSetLocale(finalLocale, i18n)
      },
      { global: true }
    )
  } else {
    // TODO: query or http status
    const finalLocale = getLocaleFromRoute(router.currentRoute) || nuxtI18nOptions.defaultLocale || initialLocale
    await loadAndSetLocale(finalLocale, i18n)
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
function proxyNuxtLegacy(context: any, target: Function) {
  return function () {
    const { app, req, route, store } = context
    return Reflect.apply(
      target,
      {
        getRouteBaseName: app.getRouteBaseName,
        i18n: app.i18n,
        localePath: app.localePath,
        localeLocation: app.localeLocation,
        localeRoute: app.localeRoute,
        localeHead: app.localeHead,
        req: process.server ? req : null,
        route,
        router: app.router
        // TODO: should implement for vuex and pinia
        // store
      },
      // eslint-disable-next-line prefer-rest-params
      arguments
    )
  }
}
