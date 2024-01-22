/**
 * This unplugin is compiler macro transform for `defineI18nRoute`
 * This code is forked from the below:
 * - original code url: https://github.com/nuxt/framework/blob/e2212ee106500acfd51e9e501428d7ef718364c2/packages/nuxt/src/pages/macros.ts
 * - author: Nuxt Framework Team
 * - license: MIT
 */

import createDebug from 'debug'
import { pathToFileURL } from 'node:url'
import { createUnplugin } from 'unplugin'
import { parseQuery, parseURL } from 'ufo'
import MagicString from 'magic-string'
import { VIRTUAL_PREFIX_HEX } from './utils'
import { NUXT_I18N_COMPOSABLE_DEFINE_ROUTE } from '../constants'

export interface TransformMacroPluginOptions {
  sourcemap?: boolean
}

const debug = createDebug('@nuxtjs/i18n:transform:macros')

/**
 * TODO:
 *  `paths`, `locales` completions like `unplugin-vue-router`
 *  ref: https://github.com/posva/unplugin-vue-router
 */

export const TransformMacroPlugin = createUnplugin((options: TransformMacroPluginOptions) => {
  return {
    name: 'nuxtjs:i18n-macros-transform',
    enforce: 'post',

    transformInclude(id) {
      if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
        return false
      }
      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href))
      return pathname.endsWith('.vue') || !!parseQuery(search).macro
    },

    transform(code, id) {
      debug('transform', id)

      const s = new MagicString(code)
      const { search } = parseURL(decodeURIComponent(pathToFileURL(id).href))

      function result() {
        if (s.hasChanged()) {
          debug('transformed: id -> ', id)
          debug('transformed: code -> ', s.toString())
          return {
            code: s.toString(),
            map: options.sourcemap ? s.generateMap({ hires: true }) : undefined
          }
        }
      }

      // tree-shake out any runtime references to the macro.
      // we do this first as it applies to all files, not just those with the query
      const match = code.match(new RegExp(`\\b${NUXT_I18N_COMPOSABLE_DEFINE_ROUTE}\\s*\\(\\s*`))
      if (match?.[0]) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        s.overwrite(match.index!, match.index! + match[0].length, `false && /*#__PURE__*/ ${match[0]}`)
      }

      if (!parseQuery(search).macro) {
        return result()
      }

      return result()
    }
  }
})
