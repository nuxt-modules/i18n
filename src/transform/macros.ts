/**
 * This unplugin is compiler macro transform for `defineI18nRoute`
 * This code is forked from the below:
 * - original code url: https://github.com/nuxt/framework/blob/e2212ee106500acfd51e9e501428d7ef718364c2/packages/nuxt/src/pages/macros.ts
 * - author: Nuxt Framework Team
 * - license: MIT
 */

import MagicString from 'magic-string'
import { createUnplugin } from 'unplugin'
import { parse as parseSFC } from '@vue/compiler-sfc'
import { VIRTUAL_PREFIX_HEX, isVue } from './utils'

import type { BundlerPluginOptions } from './utils'

const I18N_MACRO_FN_RE = /\bdefineI18nRoute\s*\(\s*/

/**
 * TODO:
 *  `paths`, `locales` completions like `unplugin-vue-router`
 *  ref: https://github.com/posva/unplugin-vue-router
 */
export const TransformMacroPlugin = (options: BundlerPluginOptions) =>
  createUnplugin(() => {
    return {
      name: 'nuxtjs:i18n-macros-transform',
      enforce: 'pre',

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
        handler(code) {
          const parsed = parseSFC(code, { sourceMap: false })
          // only transform <script>
          const script = parsed.descriptor.scriptSetup ?? parsed.descriptor.script
          if (!script) {
            return
          }

          const s = new MagicString(code)

          // match content inside <script>
          const match = script.content.match(I18N_MACRO_FN_RE)
          if (match?.[0]) {
            // tree-shake out any runtime references to the macro.
            const scriptString = new MagicString(script.content)
            scriptString.overwrite(match.index!, match.index! + match[0].length, `false && /*#__PURE__*/ ${match[0]}`)

            // using the locations from the parsed result we only replace the <script> contents
            s.overwrite(script.loc.start.offset, script.loc.end.offset, scriptString.toString())
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
