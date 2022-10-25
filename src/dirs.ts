import createDebug from 'debug'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'pathe'
import { resolvePath } from '@nuxt/kit'

const debug = createDebug('@nuxtjs/i18n:dirs')

export const distDir = dirname(fileURLToPath(import.meta.url))
export const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
const pkgDir = resolve(distDir, '..')
export const pkgModulesDir = resolve(pkgDir, './node_modules')

export async function resolveVueI18nPkgPath() {
  const p = await resolvePath('vue-i18n')
  debug('vue-i18n resolved path', p)
  return resolve(p, '../..')
}

export async function resolveVueI18nRoutingPkgPath() {
  const p = await resolvePath('vue-i18n-routing')
  debug('vue-i18n-routing resolved path', p)
  return resolve(p, '..')
}
