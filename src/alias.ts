import { tryResolveModule } from '@nuxt/kit'
import createDebug from 'debug'
import {
  VUE_I18N_PKG,
  VUE_I18N_BRIDGE_PKG,
  VUE_ROUTER_BRIDGE_PKG,
  VUE_I18N_ROUTING_PKG,
  SHARED_PKG,
  MESSAGE_COMPILER_PKG,
  CORE_BASE_PKG,
  JS_COOKIE_PKG,
  COOKIE_ES_PKG,
  UFO_PKG
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
  modules[VUE_ROUTER_BRIDGE_PKG] = `${VUE_ROUTER_BRIDGE_PKG}/lib/index.mjs`
  modules[VUE_I18N_BRIDGE_PKG] = `${VUE_I18N_BRIDGE_PKG}/lib/index.mjs`
  modules[VUE_I18N_ROUTING_PKG] = `${VUE_I18N_ROUTING_PKG}/dist/vue-i18n-routing.mjs`
  modules[JS_COOKIE_PKG] = JS_COOKIE_PKG
  modules[COOKIE_ES_PKG] = COOKIE_ES_PKG
  modules[UFO_PKG] = UFO_PKG

  for (const [moduleName, moduleFile] of Object.entries(modules)) {
    const module = await tryResolveModule(moduleFile, nuxt.options.modulesDir)
    if (!module) throw new Error(`Could not resolve module "${moduleFile}"`)
    nuxt.options.alias[moduleName] = module
    nuxt.options.build.transpile.push(moduleName)
    debug(`${moduleName} alias`, nuxt.options.alias[moduleName])
  }
}
