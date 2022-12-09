import { defineNuxtPlugin } from '#imports'

import type { Composer, ExportedGlobalComposer } from 'vue-i18n'
import type { I18nRoutingCustomProperties } from 'vue-i18n-routing/dist/vue-i18n'
import type { NuxtI18nRoutingCustomProperties } from '../types'

export default defineNuxtPlugin(() => {
  __DEBUG__ && console.log('load $i18n type definition plugin for composition mode')
})

declare module '#app' {
  interface NuxtApp {
    // @ts-ignore
    $i18n: ExportedGlobalComposer & Composer & NuxtI18nRoutingCustomProperties & I18nRoutingCustomProperties
  }
}
