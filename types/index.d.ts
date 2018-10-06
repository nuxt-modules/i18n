import Vue from 'vue'
import { Route } from 'vue-router'

declare module 'vue/types/vue' {
  interface Vue {
    localePath(route: string | Route, locale?: string): string
    switchLocalePath(locale: string): string
    getRouteBaseName(route: Route): string
  }
}
