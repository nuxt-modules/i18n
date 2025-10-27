import { directoryToURL, resolveModule } from '@nuxt/kit'
import { defu } from 'defu'
import { resolveI18nDir } from './layers'
import { getLayerI18n } from './utils'
import { relative, resolve } from 'pathe'

import type { Nuxt } from '@nuxt/schema'
import type { I18nNuxtContext } from './context'

export function setupAlias({ vueI18nRuntimeOnly }: I18nNuxtContext, nuxt: Nuxt) {
  const modules = {
    'vue-i18n': `vue-i18n/dist/vue-i18n${vueI18nRuntimeOnly ? '.runtime' : ''}`,
    '@intlify/shared': `@intlify/shared/dist/shared`,
    '@intlify/message-compiler': `@intlify/message-compiler/dist/message-compiler`,
    '@intlify/core': `@intlify/core/dist/core.node`,
    '@intlify/core-base': `@intlify/core-base/dist/core-base`,
    '@intlify/utils/h3': `@intlify/utils/dist/h3`,
  } as const

  const layerI18nDirs = nuxt.options._layers
    .map((l) => {
      const i18n = getLayerI18n(l)
      return i18n ? relative(nuxt.options.buildDir, resolve(resolveI18nDir(l, i18n), '**/*')) : undefined
    })
    .filter((x): x is string => !!x)

  const moduleIds = Object.keys(modules)
  nuxt.options.typescript = defu(nuxt.options.typescript, {
    hoist: moduleIds,
    tsConfig: {
      include: layerI18nDirs,
    },
  })

  const moduleDirs = ([] as string[])
    .concat(
      nuxt.options.modulesDir,
      nuxt.options.modulesDir.map(dir => `${dir}/@nuxtjs/i18n/node_modules`),
    )
    .map(x => directoryToURL(x))

  for (const [moduleName, moduleFile] of Object.entries(modules)) {
    const module = resolveModule(moduleFile, { url: moduleDirs })
    if (!module) { throw new Error(`Could not resolve module "${moduleFile}"`) }
    nuxt.options.alias[moduleName] = module
    nuxt.options.build.transpile.push(moduleName)
  }
}
