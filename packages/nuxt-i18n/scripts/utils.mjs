// import { pathToFileURL } from 'url'
import { createCommonJS } from 'mlly'

const NUXT_I18N_ID = '@nuxtjs/i18n'

const cjs = createCommonJS(import.meta.url)

/*
const _default = r => r.default || r

// FIXME: https://github.com/microsoft/TypeScript/issues/43329
// module: node12 will be replace it
const _importDynamic = new Function('modulePath', 'return import(modulePath)')
function importModule(path) {
  return _importDynamic(pathToFileURL(path).href).then(_default)
}
*/

export function loadModule(name) {
  try {
    return cjs.require(name)
  } catch (e) {
    err(e)
    return undefined
  }
}

export function err(...args) {
  console.error(`[${NUXT_I18N_ID}] `, ...args)
}

export function warn(...args) {
  console.warn(`[${NUXT_I18N_ID}] `, ...args)
}

export function log(...args) {
  console.log(`[${NUXT_I18N_ID}] `, ...args)
}
