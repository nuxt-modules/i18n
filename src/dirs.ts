import createDebug from 'debug'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, parse as parsePath } from 'pathe'
import { resolvePath } from '@nuxt/kit'
import { VUE_I18N_ROUTING_PKG } from './constants'
import { getPackageManagerType, tryResolve } from './utils'

const debug = createDebug('@nuxtjs/i18n:dirs')

export const distDir = dirname(fileURLToPath(import.meta.url))
export const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
const pkgDir = resolve(distDir, '..')
export const pkgModulesDir = resolve(pkgDir, './node_modules')

debug('distDir', distDir)
debug('runtimeDir', runtimeDir)
debug('pkgDir', pkgDir)
debug('pkgModulesDir', pkgModulesDir)

export async function resolveVueI18nPkgPath() {
  const p = await resolvePath('vue-i18n')
  debug('vue-i18n resolved path', p)
  return resolve(p, '../..')
}

export async function resolveVueI18nRoutingDtsPath(id: string, rootDir: string) {
  const pkgMgr = await getPackageManagerType()
  const dtsPath = `${VUE_I18N_ROUTING_PKG}/dist/${id}`
  const targets = [
    // 1st, try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, 'node_modules', dtsPath),
    // 2nd, try to resolve from `node_modules/@nuxtjs/i18n` (not hoisted case)
    resolve(pkgModulesDir, dtsPath)
  ]
  debug(`${VUE_I18N_ROUTING_PKG} resolving from ...`, targets)

  const resolved = await tryResolve(VUE_I18N_ROUTING_PKG, targets, pkgMgr, '.d.ts')
  const parsed = parsePath(resolved)
  return `${parsed.dir}/${parsed.name}`
}
