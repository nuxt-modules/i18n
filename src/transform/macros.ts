/**
 * This unplugin is compiler macro transform for `defineI18nRoute`
 * This code is forked from the below:
 * - original code url: https://github.com/nuxt/framework/blob/e2212ee106500acfd51e9e501428d7ef718364c2/packages/nuxt/src/pages/macros.ts
 * - author: Nuxt Framework Team
 * - license: MIT
 */

import MagicString from 'magic-string'
import { createUnplugin } from 'unplugin'
import { VIRTUAL_PREFIX_HEX, isVue } from './utils'
import { DEFINE_I18N_ROUTE_FN } from '../constants'

import type { BundlerPluginOptions } from './utils'
import { parseAndWalk, ScopeTracker, walk } from 'oxc-walker'

const I18N_MACRO_FN_RE = new RegExp(`\\b${DEFINE_I18N_ROUTE_FN}\\s*\\(\\s*`)

export const TransformMacroPlugin = (options: BundlerPluginOptions) =>
  createUnplugin(() => {
    return {
      name: 'nuxtjs:i18n-macros-transform',
      enforce: 'post',

      transformInclude(id) {
        if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
          return false
        }

        return isVue(id, { type: ['script'] })
      },

      transform: {
        filter: {
          code: { include: I18N_MACRO_FN_RE },
        },
        handler(code, id) {
          const s = new MagicString(code)

          try {
            // Parse and collect scope information
            const scopeTracker = new ScopeTracker({ preserveExitedScopes: true })
            const parseResult = parseAndWalk(code, id, { scopeTracker })
            scopeTracker.freeze()

            walk(parseResult.program, {
              scopeTracker,
              enter(node) {
                if (node.type !== 'CallExpression' || node.callee.type !== 'Identifier') return

                const name = node.callee.name
                if (name !== DEFINE_I18N_ROUTE_FN) return
                s.overwrite(node.start, node.end, ` false && /*@__PURE__*/ ${DEFINE_I18N_ROUTE_FN}${code.slice(node.callee.end, node.end)}`)
                this.skip()
              },
            })
          }
          catch (e) {
            console.error(e)
          }

          if (s.hasChanged()) {
            return {
              code: s.toString(),
              map: options.sourcemap ? s.generateMap({ hires: true }) : undefined,
            }
          }
        },
      },
    }
  })
