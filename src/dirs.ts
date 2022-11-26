import createDebug from 'debug'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, parse as parsePath } from 'pathe'
import { resolvePath } from '@nuxt/kit'
import { resolveLockfile } from 'pkg-types'
import { VUE_I18N_ROUTING_PKG } from './constants'

const debug = createDebug('@nuxtjs/i18n:dirs')

export const distDir = dirname(fileURLToPath(import.meta.url))
export const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
const pkgDir = resolve(distDir, '..')
export const pkgModulesDir = resolve(pkgDir, './node_modules')

const PackageManagerLockFiles = {
  'npm-shrinkwrap.json': 'npm-legacy',
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm'
} as const

type LockFile = keyof typeof PackageManagerLockFiles
type _PackageManager = typeof PackageManagerLockFiles[LockFile]
export type PackageManager = _PackageManager | 'unknown'

debug('distDir', distDir)
debug('runtimeDir', runtimeDir)
debug('pkgDir', pkgDir)
debug('pkgModulesDir', pkgModulesDir)

export async function getPackageManagerType(): Promise<PackageManager> {
  try {
    const parsed = parsePath(await resolveLockfile())
    const lockfile = `${parsed.name}${parsed.ext}` as LockFile
    debug('getPackageManagerType: lockfile', lockfile)
    if (lockfile == null) {
      return 'unknown'
    }
    const type = PackageManagerLockFiles[lockfile]
    return type == null ? 'unknown' : type
  } catch (e) {
    debug('getPackageManagerType: resolveLockfile error', e)
    throw e
  }
}

export async function resolveVueI18nPkgPath() {
  const p = await resolvePath('vue-i18n')
  debug('vue-i18n resolved path', p)
  return resolve(p, '../..')
}

export async function resolveVueI18nRoutingDtsPath(id: string) {
  const pkgMgr = await getPackageManagerType()
  if (pkgMgr === 'npm') {
    debug('resolveVueI18nRoutingDtsPath on npm', `${VUE_I18N_ROUTING_PKG}/dist/${id}`)
    return resolve(pkgModulesDir, `${VUE_I18N_ROUTING_PKG}/dist/${id}`)
  } else if (pkgMgr === 'pnpm' || pkgMgr === 'yarn') {
    const parsed = parsePath(await resolvePath(VUE_I18N_ROUTING_PKG))
    debug(`resolveVueI18nRoutingDtsPath on ${pkgMgr}`, parsed)
    return `${parsed.dir}/${id}`
  } else {
    throw new Error(`Not supported package manager`)
  }
}
