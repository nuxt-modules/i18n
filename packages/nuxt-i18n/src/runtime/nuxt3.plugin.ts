import { ref, computed } from 'vue-demi'
import { createI18n } from '@intlify/vue-i18n-bridge'
import { isEmptyObject } from '@intlify/shared'
import { createLocaleFromRouteGetter, extendI18n, registerGlobalOptions } from 'vue-i18n-routing'
import { defineNuxtPlugin, useRouter, addRouteMiddleware } from '#app'
import { messages as loadMessages, localeCodes, nuxtI18nOptions } from '#build/i18n.options.mjs'
import { loadAndSetLocale } from '#build/i18n.utils.mjs'
import { getBrowserLocale } from '#build/i18n.legacy.mjs'

import type { Composer, I18nOptions } from '@intlify/vue-i18n-bridge'
import type { RouteLocationNormalized } from 'vue-router'
import type { LocaleObject, ExtendProperyDescripters } from 'vue-i18n-routing'
import type { NuxtI18nInternalOptions } from '#build/i18n.options.mjs'

const getLocaleFromRoute = createLocaleFromRouteGetter(
  localeCodes,
  nuxtI18nOptions.routesNameSeparator,
  nuxtI18nOptions.defaultLocaleRouteNameSuffix
)

export default defineNuxtPlugin(async nuxt => {
  const router = useRouter()
  const { vueApp: app } = nuxt

  const vueI18nOptions = nuxtI18nOptions.vueI18n as I18nOptions
  const nuxtI18nOptionsInternal = nuxtI18nOptions as unknown as Required<NuxtI18nInternalOptions>
  // console.log('nuxtI18nOptions', nuxtI18nOptions, router.currentRoute)

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

  // create i18n instance
  const i18n = createI18n({
    ...vueI18nOptions,
    locale: nuxtI18nOptions.defaultLocale
  })

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

  // install vue-i18n
  // TODO: should implement `{ inject: boolean }
  app.use(i18n)

  if (process.client) {
    addRouteMiddleware(
      'locale-changing',
      (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
        const finalLocale = getLocaleFromRoute(to) || nuxtI18nOptions.defaultLocale || initialLocale
        loadAndSetLocale(finalLocale, i18n)
      },
      { global: true }
    )
  } else {
    // TODO: query or http status
    const finalLocale = getLocaleFromRoute(nuxt.ssrContext!.url) || nuxtI18nOptions.defaultLocale || initialLocale
    await loadAndSetLocale(finalLocale, i18n)
  }
})
