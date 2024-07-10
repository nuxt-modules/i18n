import { computed, effectScope } from '#imports'
import { isVueI18n, getComposer } from '../utils'
import {
  getRouteBaseName,
  localeHead,
  localeLocation,
  localePath,
  localeRoute,
  resolveRoute,
  switchLocalePath
} from '../compatibles'
import { wrapComposable } from '../../internal'
import { initCommonComposableOptions } from '../../utils'

import type { NuxtApp } from 'nuxt/app'
import type { Composer, ComposerExtender, ExportedGlobalComposer, I18n, VueI18n, VueI18nExtender } from 'vue-i18n'

/**
 * Internal options for the Vue I18n plugin.
 */
interface VueI18nInternalPluginOptions {
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

type VueI18nExtendOptions = {
  extendComposer: (composer: Composer) => void
  extendComposerInstance: (instance: VueI18n | ExportedGlobalComposer, composer: Composer) => void
}

export function extendI18n(i18n: I18n, { extendComposer, extendComposerInstance }: VueI18nExtendOptions) {
  const scope = effectScope()

  const installI18n = i18n.install.bind(i18n)
  i18n.install = (app: NuxtApp['vueApp'], ...options: unknown[]) => {
    const pluginOptions: VueI18nInternalPluginOptions = Object.assign({ inject: true }, options[0])
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
        extendComposerInstance(vueI18n, getComposer(vueI18n))
        return () => {}
      }
    }

    // install vue-i18n
    options[0] = pluginOptions
    Reflect.apply(installI18n, i18n, [app, ...options])

    const globalComposer = getComposer(i18n)

    // extend global
    scope.run(() => {
      extendComposer(globalComposer)
      if (i18n.mode === 'legacy' && isVueI18n(i18n.global)) {
        extendComposerInstance(i18n.global, getComposer(i18n.global))
      }
    })

    // extend vue component instance for Vue 3
    if (i18n.mode === 'composition' && app.config.globalProperties.$i18n != null) {
      extendComposerInstance(app.config.globalProperties.$i18n, globalComposer)
    }

    // extend vue component instance
    if (pluginOptions.inject) {
      const common = initCommonComposableOptions(i18n)
      app.mixin({
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
      const unmountApp = app.unmount.bind(app)
      app.unmount = () => {
        scope.stop()
        unmountApp()
      }
    }
  }

  return scope
}
