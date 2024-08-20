declare module 'virtual:nuxt-i18n-logger' {
  import type { ConsolaInstance } from 'consola'

  export function createLogger(label: string): ConsolaInstance
}
