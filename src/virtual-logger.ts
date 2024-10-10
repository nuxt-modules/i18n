import { createUnplugin } from 'unplugin'

export const VIRTUAL_NUXT_I18N_LOGGER = '~nuxt-i18n/logger'
export const RESOLVED_VIRTUAL_NUXT_I18N_LOGGER = `\0${VIRTUAL_NUXT_I18N_LOGGER}`

export const I18nVirtualLoggerPlugin = createUnplugin<{ debug: boolean | 'verbose' }>(options => {
  return {
    name: 'nuxtjs:i18n-logger',
    enforce: 'pre',
    resolveId(id) {
      return id === VIRTUAL_NUXT_I18N_LOGGER ? RESOLVED_VIRTUAL_NUXT_I18N_LOGGER : undefined
    },
    loadInclude(id) {
      return id === RESOLVED_VIRTUAL_NUXT_I18N_LOGGER
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_NUXT_I18N_LOGGER) return undefined

      // return stub if debug logging is disabled
      if (!options.debug) {
        return `export function createLogger() {}`
      }

      return `
import { createConsola } from 'consola'

const debugLogger = createConsola({ level: ${options.debug === 'verbose' ? 999 : 4} }).withTag('i18n')

export function createLogger(label) {
  return debugLogger.withTag(label)
}`
    }
  }
})
