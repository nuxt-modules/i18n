/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import Vue from 'vue'
import Vuex from 'vuex'
import { Route } from 'vue-router'
import '../index'

const vm = new Vue()
const locale = 'en'

let path: string | undefined

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
  vm.$router.push({ path: localizedRoute.path })
}

// $i18n

const code: string = vm.$i18n.localeProperties.code
const cookieLocale: string | undefined = vm.$i18n.getLocaleCookie()
vm.$i18n.setLocaleCookie(locale)
vm.$i18n.setLocale(locale)

// Store

const store = new Vuex.Store({})

store.$i18n.setLocale(locale)
