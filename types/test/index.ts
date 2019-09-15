import Vue from 'vue'
import Vuex from 'vuex'
import * as types from '../index'

const vm = new Vue()
const locale = 'en'

let path: string

// localePath

path = vm.localePath('/')
path = vm.localePath('/', locale)
path = vm.localePath(vm.$route)
path = vm.localePath(vm.$route, locale)

// switchLocalePath

path = vm.switchLocalePath(locale)

// getRouteBaseName

const routeBaseName: string = vm.getRouteBaseName(vm.$route)

// $i18n

const cookieLocale: string | undefined = vm.$i18n.getLocaleCookie()
vm.$i18n.setLocaleCookie(locale)
vm.$i18n.setLocale(locale)

// Store

const store = new Vuex.Store({})

store.$i18n.setLocale(locale)
