import { defineNuxtPlugin } from '#imports'
import { debugLog } from '../utils'

export default defineNuxtPlugin(() => {
  debugLog('load Meta type definition plugin')
})

// @ts-ignore
declare module 'nuxt/dist/pages/runtime' {
  interface PageMeta {
    nuxtI18n?: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}
