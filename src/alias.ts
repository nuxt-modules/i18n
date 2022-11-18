import createDebug from 'debug'
import { resolvePath } from '@nuxt/kit'
import { resolveVueI18nPkgPath, pkgModulesDir } from './dirs'
import { resolve, parse as parsePath } from 'pathe'
import { resolveLockfile } from 'pkg-types'
import { VUE_I18N_PKG, VUE_I18N_BRIDGE_PKG, VUE_ROUTER_BRIDGE_PKG, VUE_I18N_ROUTING_PKG } from './constants'

import type { Nuxt } from '@nuxt/schema'

const debug = createDebug('@nuxtjs/i18n:alias')

export async function setupAlias(nuxt: Nuxt) {
  const pkgMgr = await getPackageManagerType()
  debug('setupAlias: pkgMgr', pkgMgr)

  // resolve vue-i18@v9
  nuxt.options.alias[VUE_I18N_PKG] = await resolveVueI18nAlias(nuxt)
  nuxt.options.build.transpile.push(VUE_I18N_PKG)
  debug('vue-i18n alias', nuxt.options.alias[VUE_I18N_PKG])

  // resolve @intlify/shared
  nuxt.options.alias['@intlify/shared'] = await resolvePath('@intlify/shared')
  nuxt.options.build.transpile.push('@intlify/shared')
  debug('@intlify/shared alias', nuxt.options.alias['@intlify/shared'])

  // resolve @intlify/vue-router-bridge
  nuxt.options.alias[VUE_ROUTER_BRIDGE_PKG] = await resolveVueRouterBridgeAlias(pkgModulesDir, pkgMgr)
  nuxt.options.build.transpile.push(VUE_ROUTER_BRIDGE_PKG)
  debug('@intlify/vue-router-bridge alias', nuxt.options.alias[VUE_ROUTER_BRIDGE_PKG])

  // resolve @intlify/vue-i18n-bridge
  nuxt.options.alias[VUE_I18N_BRIDGE_PKG] = await resolveVueI18nBridgeAlias(pkgModulesDir, pkgMgr)
  nuxt.options.build.transpile.push(VUE_I18N_BRIDGE_PKG)
  debug('@intlify/vue-i18n-bridge alias', nuxt.options.alias[VUE_I18N_BRIDGE_PKG])

  // resolve vue-i18n-routing
  nuxt.options.alias[VUE_I18N_ROUTING_PKG] = await resolveVueI18nRoutingAlias(pkgModulesDir, pkgMgr)
  nuxt.options.build.transpile.push(VUE_I18N_ROUTING_PKG)
  debug('vue-i18n-routing alias', nuxt.options.alias[VUE_I18N_ROUTING_PKG])
}

const PackageManagerLockFiles = {
  'npm-shrinkwrap.json': 'npm-legacy',
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm'
} as const

type LockFile = keyof typeof PackageManagerLockFiles
type _PackageManager = typeof PackageManagerLockFiles[LockFile]
type PackageManager = _PackageManager | 'unknown'

async function getPackageManagerType(): Promise<PackageManager> {
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

async function resolveVueI18nAlias(nuxt: Nuxt) {
  return resolve(await resolveVueI18nPkgPath(), nuxt.options.dev ? 'dist/vue-i18n.mjs' : 'dist/vue-i18n.runtime.mjs')
}

async function resolveVueI18nBridgeAlias(pkgModuleDir: string, pkgMgr: PackageManager) {
  if (pkgMgr === 'npm') {
    return resolve(pkgModuleDir, `${VUE_I18N_ROUTING_PKG}/node_modules/${VUE_I18N_BRIDGE_PKG}/lib/index.mjs`)
  } else {
    const parsed = parsePath(await resolvePath(VUE_I18N_BRIDGE_PKG))
    return `${parsed.dir}/${parsed.name}.mjs`
  }
}

async function resolveVueRouterBridgeAlias(pkgModuleDir: string, pkgMgr: PackageManager) {
  if (pkgMgr === 'npm') {
    return resolve(pkgModuleDir, `${VUE_ROUTER_BRIDGE_PKG}/lib/index.mjs`)
  } else {
    const parsed = parsePath(await resolvePath(VUE_ROUTER_BRIDGE_PKG))
    return `${parsed.dir}/${parsed.name}.mjs`
  }
}

async function resolveVueI18nRoutingAlias(pkgModuleDir: string, pkgMgr: PackageManager) {
  if (pkgMgr === 'npm') {
    return resolve(pkgModuleDir, `${VUE_I18N_ROUTING_PKG}/dist/vue-i18n-routing.mjs`)
  } else if (pkgMgr === 'pnpm' || pkgMgr === 'yarn') {
    const parsed = parsePath(await resolvePath(VUE_I18N_ROUTING_PKG))
    return `${parsed.dir}/dist/vue-i18n-routing.mjs`
  } else {
    return await resolvePath(VUE_I18N_ROUTING_PKG)
  }
}
