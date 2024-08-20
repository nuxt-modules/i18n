import type { Plugin } from 'vite'

export const VIRTUAL_NUXT_I18N_LOGGER = 'virtual:nuxt-i18n-logger'
export const RESOLVED_VIRTUAL_NUXT_I18N_LOGGER = `\0${VIRTUAL_NUXT_I18N_LOGGER}`

export function i18nVirtualLoggerPlugin(debug: boolean | 'verbose') {
  return <Plugin>{
    name: 'nuxtjs:i18n-logger',
    enforce: 'pre',
    resolveId(id) {
      if (id === VIRTUAL_NUXT_I18N_LOGGER) return RESOLVED_VIRTUAL_NUXT_I18N_LOGGER
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_NUXT_I18N_LOGGER) return

      // return stub if debug logging is disabled
      if (!debug) {
        return `export function createLogger() {}`
      }

      return `
import { createConsola } from 'consola'

const debugLogger = createConsola({ level: ${debug === 'verbose' ? 999 : 4} }).withTag('i18n')

export function createLogger(label) {
  return debugLogger.withTag(label)
}`
    }
  }
}
