import type { Composer, ExportedGlobalComposer, VueI18n } from 'vue-i18n'
import type { ComposerCustomProperties, NuxtI18nRoutingCustomProperties } from './runtime/types'

declare module 'vue-i18n' {
  interface ComposerCustom extends ComposerCustomProperties {}
  interface ExportedGlobalComposer extends NuxtI18nRoutingCustomProperties {}
  interface VueI18n extends NuxtI18nRoutingCustomProperties {}
}

declare module '#app' {
  interface NuxtApp {
    $i18n: VueI18n & ExportedGlobalComposer & Composer & NuxtI18nRoutingCustomProperties
  }
}

/* eslint-disable no-var */
declare global {
  var $t: Composer['t']
  var $rt: Composer['rt']
  var $n: Composer['n']
  var $d: Composer['d']
  var $tm: Composer['tm']
  var $te: Composer['te']
}
/* eslint-enable no-var */

export {}
