import createDebug from 'debug'
import { resolvePath } from '@nuxt/kit'
import { resolveVueI18nPkgPath, pkgModulesDir } from './dirs'
import { resolve } from 'pathe'
import { VUE_I18N_PKG, VUE_I18N_BRIDGE_PKG, VUE_ROUTER_BRIDGE_PKG, VUE_I18N_ROUTING_PKG } from './constants'
import { tryResolve, getPackageManagerType } from './utils'

import type { Nuxt } from '@nuxt/schema'
import type { PackageManager } from './utils'

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
  nuxt.options.alias[VUE_ROUTER_BRIDGE_PKG] = await resolveVueRouterBridgeAlias(
    pkgModulesDir,
    nuxt.options.rootDir,
    pkgMgr
  )
  nuxt.options.build.transpile.push(VUE_ROUTER_BRIDGE_PKG)
  debug('@intlify/vue-router-bridge alias', nuxt.options.alias[VUE_ROUTER_BRIDGE_PKG])

  // resolve @intlify/vue-i18n-bridge
  nuxt.options.alias[VUE_I18N_BRIDGE_PKG] = await resolveVueI18nBridgeAlias(pkgModulesDir, nuxt.options.rootDir, pkgMgr)
  nuxt.options.build.transpile.push(VUE_I18N_BRIDGE_PKG)
  debug('@intlify/vue-i18n-bridge alias', nuxt.options.alias[VUE_I18N_BRIDGE_PKG])

  // resolve vue-i18n-routing
  nuxt.options.alias[VUE_I18N_ROUTING_PKG] = await resolveVueI18nRoutingAlias(
    pkgModulesDir,
    nuxt.options.rootDir,
    pkgMgr
  )
  nuxt.options.build.transpile.push(VUE_I18N_ROUTING_PKG)
  debug('vue-i18n-routing alias', nuxt.options.alias[VUE_I18N_ROUTING_PKG])
}

export async function resolveVueI18nAlias(nuxt: Nuxt) {
  return resolve(await resolveVueI18nPkgPath(), nuxt.options.dev ? 'dist/vue-i18n.mjs' : 'dist/vue-i18n.runtime.mjs')
}

/**
 * NOTE:
 *  The following packages may not be able to resolve the file paths of the target ES modules with `resolvePath`
 *  so they resolve them on their own (sometimes, these are resolved as `cjs`)
 *  - `vue-i18n-routing`
 *  - `@intlify/vue-i18n-bridge`
 *  - `@intlify/vue-router-bridge`
 */

async function resolveVueI18nBridgeAlias(pkgModulesDir: string, rootDir: string, pkgMgr: PackageManager) {
  const modulePath = `${VUE_I18N_BRIDGE_PKG}/lib/index.mjs` as const
  const targets = [
    // 1st, try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, 'node_modules', modulePath),
    // 2nd, try to resolve from `node_modules/vue-i18n-routing` (not hoisted case)
    resolve(rootDir, 'node_modules', `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath),
    // 3rd, try to resolve from `node_modules/@nuxtjs/i18n` (not hoisted case)
    resolve(pkgModulesDir, modulePath),
    // 4th, try to resolve from `node_modules/@nuxtjs/i18n/node_modules/vue-i18n-routing` (not hoisted case)
    resolve(pkgModulesDir, `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath)
  ]
  debug(`${VUE_I18N_BRIDGE_PKG} resolving from ...`, targets)

  return tryResolve(VUE_I18N_BRIDGE_PKG, targets, pkgMgr)
}

async function resolveVueRouterBridgeAlias(pkgModulesDir: string, rootDir: string, pkgMgr: PackageManager) {
  const modulePath = `${VUE_ROUTER_BRIDGE_PKG}/lib/index.mjs` as const
  const targets = [
    // 1st, try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, 'node_modules', modulePath),
    // 2nd, try to resolve from `node_modules/vue-i18n-routing` (not hoisted case)
    resolve(rootDir, 'node_modules', `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath),
    // 3rd, try to resolve from `node_modules/@nuxtjs/i18n` (not hoisted case)
    resolve(pkgModulesDir, modulePath),
    // 4th, try to resolve from `node_modules/@nuxtjs/i18n/node_modules/vue-i18n-routing` (not hoisted case)
    resolve(pkgModulesDir, `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath)
  ]
  debug(`${VUE_ROUTER_BRIDGE_PKG} resolving from ...`, targets)

  return tryResolve(VUE_ROUTER_BRIDGE_PKG, targets, pkgMgr)
}

export async function resolveVueI18nRoutingAlias(pkgModulesDir: string, rootDir: string, pkgMgr: PackageManager) {
  const modulePath = `${VUE_I18N_ROUTING_PKG}/dist/vue-i18n-routing.mjs` as const
  const targets = [
    // 1st, try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, 'node_modules', modulePath),
    // 2nd, try to resolve from `node_modules/@nuxtjs/i18n` (not hoisted case)
    resolve(pkgModulesDir, modulePath)
  ]
  debug(`${VUE_I18N_ROUTING_PKG} resolving from ...`, targets)

  return tryResolve(VUE_I18N_ROUTING_PKG, targets, pkgMgr)
}
