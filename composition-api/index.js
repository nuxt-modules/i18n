import Vue from 'vue'
import { computed, useContext, getCurrentInstance } from '@nuxtjs/composition-api'

/** @return {import('./types/composition').NuxtI18nCompositionApi} */
export function useI18n () {
  const { app } = useContext()
  const { i18n } = app

  if (!i18n) {
    throw new Error('@nuxtjs/i18n not initialized')
  }

  const instance = getCurrentInstance()
  const vm = instance?.proxy || new Vue({})

  const locale = computed({
    get () {
      return i18n.locale
    },
    /** @param {string} v */
    set (v) {
      i18n.setLocale(v)
    }
  })

  return {
    ...i18n,
    locale,
    getRouteBaseName: app.getRouteBaseName,
    localeLocation: app.localeLocation,
    localePath: app.localePath,
    localeRoute: app.localeRoute,
    nuxtI18nHead: vm.$nuxtI18nHead.bind(vm),
    switchLocalePath: app.switchLocalePath,
    t: vm.$t.bind(vm),
    tc: vm.$tc.bind(vm),
    d: vm.$d.bind(vm),
    te: vm.$te.bind(vm),
    n: vm.$n.bind(vm)
  }
}
