import { directoryToURL, resolveModule } from '@nuxt/kit'
import {
  VUE_I18N_PKG,
  SHARED_PKG,
  MESSAGE_COMPILER_PKG,
  CORE_PKG,
  CORE_BASE_PKG,
  UTILS_PKG,
  UTILS_H3_PKG,
  UFO_PKG,
  NUXT_I18N_MODULE_ID
} from './constants'

import type { Nuxt } from '@nuxt/schema'
import type { I18nNuxtContext } from './context'

export function setupAlias({ userOptions: options }: I18nNuxtContext, nuxt: Nuxt) {
  const modules = {
    [VUE_I18N_PKG]: `${VUE_I18N_PKG}/dist/vue-i18n${!nuxt.options.dev && !nuxt.options._prepare && options.bundle?.runtimeOnly ? '.runtime' : ''}.mjs`,
    [SHARED_PKG]: `${SHARED_PKG}/dist/shared.mjs`,
    [MESSAGE_COMPILER_PKG]: `${MESSAGE_COMPILER_PKG}/dist/message-compiler.mjs`,
    [CORE_BASE_PKG]: `${CORE_BASE_PKG}/dist/core-base.mjs`,
    [CORE_PKG]: `${CORE_PKG}/dist/core.node.mjs`,
    [UTILS_H3_PKG]: `${UTILS_PKG}/dist/h3.mjs`, // for `@intlify/utils/h3`
    [UFO_PKG]: UFO_PKG
  } as const

  const moduleDirs = ([] as string[])
    .concat(
      nuxt.options.modulesDir,
      nuxt.options.modulesDir.map(dir => `${dir}/${NUXT_I18N_MODULE_ID}/node_modules`)
    )
    .map(x => directoryToURL(x))

  for (const [moduleName, moduleFile] of Object.entries(modules)) {
    const module = resolveModule(moduleFile, { url: moduleDirs })
    if (!module) throw new Error(`Could not resolve module "${moduleFile}"`)
    nuxt.options.alias[moduleName] = module
    nuxt.options.build.transpile.push(moduleName)
  }
}
