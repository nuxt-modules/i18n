import createDebug from 'debug'
import { pathToFileURL } from 'node:url'
import { createUnplugin } from 'unplugin'
import { parseQuery, parseURL } from 'ufo'
import MagicString from 'magic-string'
import { VIRTUAL_PREFIX_HEX } from './utils'

export interface MetaDeprecationPluginOptions {
  sourcemap?: boolean
}

const debug = createDebug('@nuxtjs/i18n:transform:meta-deprecation')

export const MetaDeprecationPlugin = createUnplugin((options: MetaDeprecationPluginOptions) => {
  debug('options', options)

  return {
    name: 'nuxtjs:i18n-meta-deprecation',
    enforce: 'post',

    transformInclude(id) {
      debug('transformInclude', id)

      if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
        return false
      }

      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href))
      return pathname.endsWith('.vue') || !!parseQuery(search).macro
    },

    transform(code, id) {
      debug('transform', id)

      const { pathname } = parseURL(decodeURIComponent(pathToFileURL(id).href))

      const s = new MagicString(code)

      function result() {
        if (s.hasChanged()) {
          return {
            code: s.toString(),
            map: options.sourcemap && !/\.([c|m]?ts)$/.test(pathname) ? s.generateMap({ hires: true }) : null
          }
        }
      }

      const match = code.match(new RegExp(`\\bdefinePageMeta\\({[.\\s]+(?=nuxtI18n)`))
      if (match?.[0]) {
        // prettier-ignore
        console.warn(
          `Setting \`nuxtI18n\` on \`definePageMeta\` is deprecated and will be removed in \`v8.1\`, use the \`useSetI18nParams\` composable instead.\nUsage found in ${id.split('?')[0]}`
        )
      }

      return result()
    }
  }
})
