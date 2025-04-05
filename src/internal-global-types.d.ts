import type { Composer, VueI18n } from 'vue-i18n'
import type { ComposerCustomProperties } from './runtime/types'

declare module 'vue-i18n' {
  interface ComposerCustom extends ComposerCustomProperties {}
  interface ExportedGlobalComposer extends ComposerCustomProperties {}
  interface VueI18n extends ComposerCustomProperties {}
}

declare module '#app' {
  interface NuxtApp {
    $i18n: VueI18n & Composer
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
