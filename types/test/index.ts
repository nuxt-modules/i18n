/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import Vue from 'vue'
import Vuex from 'vuex'
import { Route } from 'vue-router'
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

const routeBaseName: string = vm.getRouteBaseName(vm.$route)

// localeRoute

const localizedRoute: Route = vm.localeRoute('about', 'fr')

// $i18n

const cookieLocale: string | undefined = vm.$i18n.getLocaleCookie()
vm.$i18n.setLocaleCookie(locale)
vm.$i18n.setLocale(locale)

// Store

const store = new Vuex.Store({})

store.$i18n.setLocale(locale)
