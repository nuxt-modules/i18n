import MagicString from 'magic-string'
import { createUnplugin } from 'unplugin'

import type { BundlerPluginOptions } from './utils'
import type { I18nNuxtContext } from '../context'
import { relative } from 'pathe'
import { useNuxt } from '@nuxt/kit'

/**
 * Swap out impounded logic where vue/nuxt aliases are not available and not needed
 * - replaces "#app" import with a mock variable definition
 * - replaces `useNuxtApp()` with the mock variable
 */
export const HeistPlugin = (options: BundlerPluginOptions, ctx: I18nNuxtContext, nuxt = useNuxt()) => {
  // transform `runtime/shared` to be nuxt/nitro context agnostic
  const shared = ctx.resolver.resolve(ctx.distDir, 'runtime/shared/*')

  const replacementName = `__nuxtMock`
  const replacementMock = `const ${replacementName} = { runWithContext: async (fn) => await fn() };`
  const resources = ['i18n-route-resources.mjs', 'i18n-options.mjs']

  return createUnplugin(() => ({
    name: 'nuxtjs:i18n-heist',
    enforce: 'pre',
    transform: {
      filter: {
        id: [shared, relative(nuxt.options.rootDir, shared)]
      },
      handler(code) {
        const s = new MagicString(code)

        // add nitro runtime import
        if (code.includes('useRuntimeConfig()')) {
          s.prepend('import { useRuntimeConfig } from "nitropack/runtime";\n')
        }

        // replace `#app` import with a mock variable definition
        s.replace(/import.+["']#app["'];?/, replacementMock)

        // replace `#app` with `__nuxtMock`
        s.replaceAll(/useNuxtApp\(\)/g, replacementName)

        for (const resource of resources) {
          s.replaceAll(new RegExp(`#build/${resource}`, 'g'), `#internal/${resource}`)
        }

        return {
          code: s.toString(),
          map: options.sourcemap ? s.generateMap({ hires: true }) : undefined
        }
      }
    }
  }))
}
