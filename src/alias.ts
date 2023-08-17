import createDebug from 'debug'
import { resolve } from 'pathe'
import {
  VUE_I18N_PKG,
  VUE_I18N_BRIDGE_PKG,
  VUE_ROUTER_BRIDGE_PKG,
  VUE_I18N_ROUTING_PKG,
  SHARED_PKG,
  MESSAGE_COMPILER_PKG
} from './constants'
import { pkgModulesDir } from './dirs'
import { tryResolve, getLayerRootDirs, getPackageManagerType } from './utils'

import type { Nuxt } from '@nuxt/schema'
import type { PackageManager } from './utils'
import type { NuxtI18nOptions } from './types'

const debug = createDebug('@nuxtjs/i18n:alias')

export async function setupAlias(nuxt: Nuxt, options: NuxtI18nOptions) {
  const pkgMgr = await getPackageManagerType()
  debug('setupAlias: pkgMgr', pkgMgr)

  // resolve vue-i18@v9
  nuxt.options.alias[VUE_I18N_PKG] = await resolveVueI18nAlias(pkgModulesDir, options, nuxt, pkgMgr)
  nuxt.options.build.transpile.push(VUE_I18N_PKG)
  debug('vue-i18n alias', nuxt.options.alias[VUE_I18N_PKG])

  // resolve @intlify/shared
  nuxt.options.alias[SHARED_PKG] = await resolveSharedAlias(pkgModulesDir, nuxt, pkgMgr)
  nuxt.options.build.transpile.push(SHARED_PKG)
  debug('@intlify/shared alias', nuxt.options.alias[SHARED_PKG])

  nuxt.options.alias['@intlify/message-compiler'] = await resolveMessageCompilerAlias(pkgModulesDir, nuxt, pkgMgr)
  nuxt.options.build.transpile.push(MESSAGE_COMPILER_PKG)
  debug('@intlify/message-compiler alias', nuxt.options.alias[MESSAGE_COMPILER_PKG])

  // resolve @intlify/vue-router-bridge
  nuxt.options.alias[VUE_ROUTER_BRIDGE_PKG] = await resolveVueRouterBridgeAlias(pkgModulesDir, nuxt, pkgMgr)
  nuxt.options.build.transpile.push(VUE_ROUTER_BRIDGE_PKG)
  debug('@intlify/vue-router-bridge alias', nuxt.options.alias[VUE_ROUTER_BRIDGE_PKG])

  // resolve @intlify/vue-i18n-bridge
  nuxt.options.alias[VUE_I18N_BRIDGE_PKG] = await resolveVueI18nBridgeAlias(pkgModulesDir, nuxt, pkgMgr)
  nuxt.options.build.transpile.push(VUE_I18N_BRIDGE_PKG)
  debug('@intlify/vue-i18n-bridge alias', nuxt.options.alias[VUE_I18N_BRIDGE_PKG])

  // resolve vue-i18n-routing
  nuxt.options.alias[VUE_I18N_ROUTING_PKG] = await resolveVueI18nRoutingAlias(pkgModulesDir, nuxt, pkgMgr)
  nuxt.options.build.transpile.push(VUE_I18N_ROUTING_PKG)
  debug('vue-i18n-routing alias', nuxt.options.alias[VUE_I18N_ROUTING_PKG])
}

/**
 * NOTE:
 *  The following packages maybe installed in directories
 *  where the package manager `node_modules` installation algorithm cannot resolve the file path of the target ES module with `resolvePath` (`@nuxt/kit`).
 *  (e.g. npm peerDependencies).
 *  - `vue-i18n`
 *  - `vue-i18n-routing`
 *  - `@intlify/shared`
 *  - `@intlify/vue-i18n-bridge`
 *  - `@intlify/vue-router-bridge`
 */

export async function resolveVueI18nAlias(
  pkgModulesDir: string,
  options: NuxtI18nOptions,
  nuxt: Nuxt,
  pkgMgr: PackageManager
) {
  const { rootDir, workspaceDir } = nuxt.options
  const runtimeOnly = options.bundle?.runtimeOnly
  const modulePath =
    nuxt.options.dev || nuxt.options._prepare
      ? `${VUE_I18N_PKG}/dist/vue-i18n.mjs`
      : `${VUE_I18N_PKG}/dist/vue-i18n${runtimeOnly ? '.runtime' : ''}.mjs`
  const targets = [
    // for Nuxt layer
    ...getLayerRootDirs(nuxt).map(root => resolve(root, 'node_modules', modulePath)),
    // try to resolve from `node_modules/@nuxtjs/i18n/node_modules` (not hoisted case)
    resolve(pkgModulesDir, modulePath),
    // try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, 'node_modules', modulePath),
    // workspace directories
    resolve(workspaceDir, 'node_modules', modulePath)
  ]
  debug(`${VUE_I18N_PKG} resolving from ...`, targets)

  return tryResolve(VUE_I18N_PKG, targets, pkgMgr)
}

export async function resolveSharedAlias(pkgModulesDir: string, nuxt: Nuxt, pkgMgr: PackageManager) {
  const { rootDir, workspaceDir } = nuxt.options
  const modulePath = `${SHARED_PKG}/dist/shared.mjs` as const
  const targets = [
    // for Nuxt layer
    ...getLayerRootDirs(nuxt).map(root => resolve(root, `${VUE_I18N_PKG}/node_modules`, modulePath)),
    ...getLayerRootDirs(nuxt).map(root => resolve(root, `${MESSAGE_COMPILER_PKG}/node_modules`, modulePath)),
    ...getLayerRootDirs(nuxt).map(root => resolve(root, 'node_modules', modulePath)),
    // try to resolve from `node_modules/@nuxtjs/i18n/node_modules` (not hoisted case)
    resolve(pkgModulesDir, modulePath),
    // try to resolve from `node_modules/@nuxtjs/i18n/node_modules/vue-i18n/node_modules` (not hoisted case)
    resolve(pkgModulesDir, `${VUE_I18N_PKG}/node_modules`, modulePath),
    // try to resolve from `node_modules/@nuxtjs/i18n/node_modules/@intlify/message-compiler/node_modules` (not hoisted case)
    resolve(pkgModulesDir, `${MESSAGE_COMPILER_PKG}/node_modules`, modulePath),
    // try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, 'node_modules', modulePath),
    // workspace directories
    resolve(workspaceDir, 'node_modules', `${VUE_I18N_PKG}/node_modules`, modulePath),
    resolve(workspaceDir, 'node_modules', `${MESSAGE_COMPILER_PKG}/node_modules`, modulePath),
    resolve(workspaceDir, 'node_modules', modulePath)
  ]
  debug(`${SHARED_PKG} resolving from ...`, targets)

  return tryResolve(SHARED_PKG, targets, pkgMgr)
}

export async function resolveMessageCompilerAlias(pkgModulesDir: string, nuxt: Nuxt, pkgMgr: PackageManager) {
  const { rootDir, workspaceDir } = nuxt.options
  const modulePath = `${MESSAGE_COMPILER_PKG}/dist/message-compiler.mjs` as const
  const targets = [
    // for Nuxt layer
    ...getLayerRootDirs(nuxt).map(root => resolve(root, 'node_modules', modulePath)),
    // try to resolve from `node_modules/@nuxtjs/i18n` (not hoisted case)
    resolve(pkgModulesDir, modulePath),
    // try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, 'node_modules', modulePath),
    // workspace directories
    resolve(workspaceDir, 'node_modules', modulePath)
  ]
  debug(`${MESSAGE_COMPILER_PKG} resolving from ...`, targets)

  return tryResolve(MESSAGE_COMPILER_PKG, targets, pkgMgr)
}

async function resolveVueI18nBridgeAlias(pkgModulesDir: string, nuxt: Nuxt, pkgMgr: PackageManager) {
  const { rootDir, workspaceDir } = nuxt.options
  const modulePath = `${VUE_I18N_BRIDGE_PKG}/lib/index.mjs` as const
  const targets = [
    // for Nuxt layer
    ...getLayerRootDirs(nuxt).map(root => resolve(root, `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath)),
    ...getLayerRootDirs(nuxt).map(root => resolve(root, 'node_modules', modulePath)),
    // try to resolve from `node_modules/@nuxtjs/i18n` (not hoisted case)
    resolve(pkgModulesDir, modulePath),
    // try to resolve from `node_modules/@nuxtjs/i18n/node_modules/vue-i18n-routing` (not hoisted case)
    resolve(pkgModulesDir, `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath),
    // try to resolve from `node_modules/vue-i18n-routing` (hoisted case)
    resolve(rootDir, 'node_modules', `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath),
    // try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, 'node_modules', modulePath),
    // workspace directories
    resolve(workspaceDir, 'node_modules', `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath),
    resolve(workspaceDir, 'node_modules', modulePath)
  ]
  debug(`${VUE_I18N_BRIDGE_PKG} resolving from ...`, targets)

  return tryResolve(VUE_I18N_BRIDGE_PKG, targets, pkgMgr)
}

async function resolveVueRouterBridgeAlias(pkgModulesDir: string, nuxt: Nuxt, pkgMgr: PackageManager) {
  const { rootDir, workspaceDir } = nuxt.options
  const modulePath = `${VUE_ROUTER_BRIDGE_PKG}/lib/index.mjs` as const
  const targets = [
    // for Nuxt layer
    ...getLayerRootDirs(nuxt).map(root => resolve(root, `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath)),
    ...getLayerRootDirs(nuxt).map(root => resolve(root, 'node_modules', modulePath)),
    // try to resolve from `node_modules/@nuxtjs/i18n` (not hoisted case)
    resolve(pkgModulesDir, modulePath),
    // try to resolve from `node_modules/@nuxtjs/i18n/node_modules/vue-i18n-routing` (not hoisted case)
    resolve(pkgModulesDir, `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath),
    // try to resolve from `node_modules/vue-i18n-routing` (hoisted case)
    resolve(rootDir, 'node_modules', `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath),
    // try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, 'node_modules', modulePath),
    // workspace directories
    resolve(workspaceDir, 'node_modules', `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath),
    resolve(workspaceDir, 'node_modules', modulePath)
  ]
  debug(`${VUE_ROUTER_BRIDGE_PKG} resolving from ...`, targets)

  return tryResolve(VUE_ROUTER_BRIDGE_PKG, targets, pkgMgr)
}

export async function resolveVueI18nRoutingAlias(pkgModulesDir: string, nuxt: Nuxt, pkgMgr: PackageManager) {
  const { rootDir, workspaceDir } = nuxt.options
  const modulePath = `${VUE_I18N_ROUTING_PKG}/dist/vue-i18n-routing.mjs` as const
  const targets = [
    // for Nuxt layer
    ...getLayerRootDirs(nuxt).map(root => resolve(root, 'node_modules', modulePath)),
    // try to resolve from `node_modules/@nuxtjs/i18n` (not hoisted case)
    resolve(pkgModulesDir, modulePath),
    // try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, 'node_modules', modulePath),
    // workspace directories
    resolve(workspaceDir, 'node_modules', modulePath)
  ]
  debug(`${VUE_I18N_ROUTING_PKG} resolving from ...`, targets)

  return tryResolve(VUE_I18N_ROUTING_PKG, targets, pkgMgr)
}
