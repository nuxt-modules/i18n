import { tryResolveModule } from '@nuxt/kit'
import createDebug from 'debug'
import {
  VUE_I18N_PKG,
  VUE_I18N_BRIDGE_PKG,
  VUE_ROUTER_BRIDGE_PKG,
  VUE_I18N_ROUTING_PKG,
  SHARED_PKG,
  MESSAGE_COMPILER_PKG,
  CORE_PKG,
  CORE_BASE_PKG,
  UTILS_PKG,
  UTILS_H3_PKG,
  UFO_PKG,
  IS_HTTPS_PKG,
  NUXT_I18N_MODULE_ID
} from './constants'

import type { Nuxt } from '@nuxt/schema'
import type { NuxtI18nOptions } from './types'

const debug = createDebug('@nuxtjs/i18n:alias')

export async function setupAlias(nuxt: Nuxt, options: NuxtI18nOptions) {
  const runtimeOnly = options.bundle?.runtimeOnly
  const modules: Record<string, string> = {}

  modules[VUE_I18N_PKG] =
    nuxt.options.dev || nuxt.options._prepare
      ? `${VUE_I18N_PKG}/dist/vue-i18n.mjs`
      : `${VUE_I18N_PKG}/dist/vue-i18n${runtimeOnly ? '.runtime' : ''}.mjs`
  modules[SHARED_PKG] = `${SHARED_PKG}/dist/shared.mjs`
  modules[MESSAGE_COMPILER_PKG] = `${MESSAGE_COMPILER_PKG}/dist/message-compiler.mjs`
  modules[CORE_BASE_PKG] = `${CORE_BASE_PKG}/dist/core-base.mjs`
  modules[CORE_PKG] = `${CORE_PKG}/dist/core.node.mjs`
  modules[UTILS_H3_PKG] = `${UTILS_PKG}/dist/h3.mjs` // for `@intlify/utils/h3`
  modules[VUE_ROUTER_BRIDGE_PKG] = `${VUE_ROUTER_BRIDGE_PKG}/lib/index.mjs`
  modules[VUE_I18N_BRIDGE_PKG] = `${VUE_I18N_BRIDGE_PKG}/lib/index.mjs`
  modules[VUE_I18N_ROUTING_PKG] = `${VUE_I18N_ROUTING_PKG}/dist/vue-i18n-routing.mjs`
  modules[UFO_PKG] = UFO_PKG
  modules[IS_HTTPS_PKG] = IS_HTTPS_PKG

  const moduleDirs: string[] = nuxt.options.modulesDir || []
  const enhancedModulesDirs = [...moduleDirs, ...moduleDirs.map(dir => `${dir}/${NUXT_I18N_MODULE_ID}/node_modules`)]

  for (const [moduleName, moduleFile] of Object.entries(modules)) {
    const module = await tryResolveModule(moduleFile, enhancedModulesDirs)
    if (!module) throw new Error(`Could not resolve module "${moduleFile}"`)
    nuxt.options.alias[moduleName] = module
    nuxt.options.build.transpile.push(moduleName)
    debug(`${moduleName} alias`, nuxt.options.alias[moduleName])
  }
}
