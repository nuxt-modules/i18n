import { Route } from 'vue-router'
import 'vue-i18n'

type onNavigateInternal = (route: Route) => Promise<[number | null, string | null] | [number | null, string | null, boolean | undefined]>

declare module 'vue-i18n' {
  // the VueI18n class expands here: https://goo.gl/Xtp9EG
  // it is necessary for the $i18n property in Vue interface: "readonly $i18n: VueI18n & IVueI18n"
  interface IVueI18n {
    // Internal.
    __baseUrl: string
    __onNavigate: onNavigateInternal
    __pendingLocale: string | null | undefined
    __pendingLocalePromise: Promise<string> | undefined
    __redirect: string | null
    __resolvePendingLocalePromise: (value: string) => void | undefined
  }
}
