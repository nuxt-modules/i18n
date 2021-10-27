/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import Vue from 'vue'
import { Store } from 'vuex'
import { Location, Route } from 'vue-router'
import { Plugin } from '@nuxt/types'
import '../index'

const vm = new Vue()
const locale = 'en'

let path: string

// localePath

path = vm.localePath('/')
path = vm.localePath('/', locale)
path = vm.localePath({ name: 'index' })
path = vm.localePath({ path: '/', query: { a: '1' }, params: { p: 'a' } }, locale)

// switchLocalePath

path = vm.switchLocalePath(locale)

// getRouteBaseName

const routeBaseName: string | undefined = vm.getRouteBaseName(vm.$route)

// localeRoute

const localizedRoute: Route | undefined = vm.localeRoute('about', 'fr')
if (localizedRoute) {
  const { fullPath } = localizedRoute
}

// localeLocation

const localizedLocation: Location | undefined = vm.localeLocation('about', 'fr')
if (localizedLocation) {
  vm.$router.push(localizedLocation)
}

// $i18n

const code: string = vm.$i18n.localeProperties.code
const cookieLocale: string | undefined = vm.$i18n.getLocaleCookie()
vm.$i18n.setLocaleCookie(locale)
vm.$i18n.setLocale(locale)

// Store

const store = new Store({})

store.$i18n.setLocale(locale)

const nuxtPlugin: Plugin = function (context) {
  const { i18n, getRouteBaseName, localePath, localeRoute, switchLocalePath } = context
  const { locale } = i18n
}
