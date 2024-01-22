import type { Composer, ExportedGlobalComposer, VueI18n } from 'vue-i18n'
import type { ComposerCustomProperties, NuxtI18nRoutingCustomProperties } from './runtime/types'

declare module 'vue-i18n' {
  interface ComposerCustom extends ComposerCustomProperties {}
  interface ExportedGlobalComposer extends NuxtI18nRoutingCustomProperties {}
  interface VueI18n extends NuxtI18nRoutingCustomProperties {}
}

declare module '#app' {
  interface NuxtApp {
    $i18n: VueI18n & ExportedGlobalComposer & Composer & NuxtI18nRoutingCustomProperties & I18nRoutingCustomProperties
  }
}

export {}
