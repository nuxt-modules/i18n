import { defineNuxtPlugin } from '#imports'

import type { VueI18n } from 'vue-i18n'
import type { I18nRoutingCustomProperties } from 'vue-i18n-routing/dist/vue-i18n'
import type { NuxtI18nRoutingCustomProperties } from '../types'

export default defineNuxtPlugin<{
  i18n: VueI18n & NuxtI18nRoutingCustomProperties & I18nRoutingCustomProperties
}>(() => {
  __DEBUG__ && console.log('load $i18n type definition plugin for legacy mode')
  // return {
  //   provide: {
  //     i18n: nuxt.__i18n.global
  //   }
  // }
})

declare module '#app' {
  interface NuxtApp {
    // @ts-ignore
    $i18n: VueI18n & NuxtI18nRoutingCustomProperties & I18nRoutingCustomProperties
  }
}

/*
// @ts-ignore
declare module 'nuxt/dist/app/nuxt' {
  interface NuxtApp {
    $i18n: VueI18n & NuxtI18nRoutingCustomProperties & I18nRoutingCustomProperties
  }
}
*/
