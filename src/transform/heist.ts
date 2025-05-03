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
  // TODO: consider using a folder for shared nuxt/nitro utilities (that use `useNuxtApp().runWithContext()`)
  const targetFile = ctx.resolver.resolve(ctx.distDir, 'runtime/messages')

  const replacementName = `__nuxtMock`
  const replacementMock = `const ${replacementName} = { runWithContext: async (fn) => await fn() };`
  const variants = [targetFile, relative(nuxt.options.rootDir, targetFile)].flatMap(x =>
    ['.ts', '.js', '.mjs'].map(y => x + y)
  )

  return createUnplugin(() => ({
    name: 'nuxtjs:i18n-heist',
    enforce: 'pre',
    transform: {
      filter: {
        id: variants
      },
      handler(code) {
        const s = new MagicString(code)

        s.replace(/import.+["']#app["'];?/, replacementMock)
        s.replaceAll(/useNuxtApp\(\)/g, replacementName)

        return {
          code: s.toString(),
          map: options.sourcemap ? s.generateMap({ hires: true }) : undefined
        }
      }
    }
  }))
}
