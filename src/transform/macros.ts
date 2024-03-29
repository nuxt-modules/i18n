/**
 * This unplugin is compiler macro transform for `defineI18nRoute`
 * This code is forked from the below:
 * - original code url: https://github.com/nuxt/framework/blob/e2212ee106500acfd51e9e501428d7ef718364c2/packages/nuxt/src/pages/macros.ts
 * - author: Nuxt Framework Team
 * - license: MIT
 */

import createDebug from 'debug'
import MagicString from 'magic-string'
import { createUnplugin } from 'unplugin'
import { parse as parseSFC } from '@vue/compiler-sfc'
import { VIRTUAL_PREFIX_HEX, isVue } from './utils'
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
    enforce: 'pre',

    transformInclude(id) {
      if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
        return false
      }

      return isVue(id, { type: ['script'] })
    },

    transform(code, id) {
      debug('transform', id)

      const parsed = parseSFC(code, { sourceMap: false })
      // only transform <script>
      const script = parsed.descriptor.scriptSetup ?? parsed.descriptor.script
      if (!script) {
        return
      }

      const s = new MagicString(code)

      // match content inside <script>
      const match = script.content.match(new RegExp(`\\b${NUXT_I18N_COMPOSABLE_DEFINE_ROUTE}\\s*\\(\\s*`))
      if (match?.[0]) {
        // tree-shake out any runtime references to the macro.
        const scriptString = new MagicString(script.content)
        scriptString.overwrite(match.index!, match.index! + match[0].length, `false && /*#__PURE__*/ ${match[0]}`)

        // using the locations from the parsed result we only replace the <script> contents
        s.overwrite(script.loc.start.offset, script.loc.end.offset, scriptString.toString())
      }

      if (s.hasChanged()) {
        debug('transformed: id -> ', id)
        debug('transformed: code -> ', s.toString())

        return {
          code: s.toString(),
          map: options.sourcemap ? s.generateMap({ hires: true }) : undefined
        }
      }
    }
  }
})
