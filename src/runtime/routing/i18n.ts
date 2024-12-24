import { effectScope } from '#imports'
import { getComposer } from '../compatibility'

import type { NuxtApp } from 'nuxt/app'
import type { Composer, ComposerExtender, ExportedGlobalComposer, I18n, VueI18n, VueI18nExtender } from 'vue-i18n'

/**
 * Internal options for the Vue I18n plugin.
 */
interface VueI18nInternalPluginOptions {
  __composerExtend?: ComposerExtender
  __vueI18nExtend?: VueI18nExtender
}

type VueI18nExtendOptions = {
  extendComposer: (composer: Composer) => void
  extendComposerInstance: (instance: Composer | VueI18n | ExportedGlobalComposer, composer: Composer) => void
}

/**
 * Extend the Vue I18n plugin installation
 *
 * This extends the Composer or Vue I18n (legacy) instance with additional
 * properties and methods, and injects methods into Vue components.
 */
export function extendI18n(i18n: I18n, { extendComposer, extendComposerInstance }: VueI18nExtendOptions) {
  const scope = effectScope()

  const installI18n = i18n.install.bind(i18n)
  i18n.install = (app: NuxtApp['vueApp'], ...options: VueI18nInternalPluginOptions[]) => {
    const pluginOptions = Object.assign({}, options[0])

    pluginOptions.__composerExtend = (c: Composer) => {
      extendComposerInstance(c, getComposer(i18n))
      return () => {}
    }

    if (i18n.mode === 'legacy') {
      pluginOptions.__vueI18nExtend = (vueI18n: VueI18n) => {
        extendComposerInstance(vueI18n, getComposer(vueI18n))
        return () => {}
      }
    }

    // install Vue I18n
    Reflect.apply(installI18n, i18n, [app, pluginOptions])

    const globalComposer = getComposer(i18n)

    // extend global
    scope.run(() => {
      extendComposer(globalComposer)
      if (i18n.mode === 'legacy' && '__composer' in i18n.global) {
        extendComposerInstance(i18n.global, getComposer(i18n.global))
      }
    })

    // extend Vue component instance for Vue 3
    if (i18n.mode === 'composition' && app.config.globalProperties.$i18n != null) {
      extendComposerInstance(app.config.globalProperties.$i18n, globalComposer)
    }

    // dispose effectScope during app unmount
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
