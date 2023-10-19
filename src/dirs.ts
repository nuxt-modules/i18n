import createDebug from 'debug'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'pathe'

const debug = createDebug('@nuxtjs/i18n:dirs')

export const distDir = dirname(fileURLToPath(import.meta.url))
export const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
const pkgDir = resolve(distDir, '..')

debug('distDir', distDir)
debug('runtimeDir', runtimeDir)
debug('pkgDir', pkgDir)
