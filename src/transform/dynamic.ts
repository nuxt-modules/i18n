import createDebug from 'debug'
import { pathToFileURL } from 'node:url'
import { createUnplugin } from 'unplugin'
import { parseQuery, parseURL } from 'ufo'
import MagicString from 'magic-string'
import { VIRTUAL_PREFIX_HEX } from './utils'
import { NUXT_I18N_COMPOSABLE_DEFINE_LOCALE, NUXT_I18N_COMPOSABLE_DEFINE_CONFIG } from '../constants'

export interface ResourceDynamicPluginOptions {
  sourcemap?: boolean
}

const debug = createDebug('@nuxtjs/i18n:transform:dynamic')

export const ResourceDynamicPlugin = createUnplugin((options: ResourceDynamicPluginOptions) => {
  debug('options', options)

  return {
    name: 'nuxtjs:i18n-resource-dynamic',
    enforce: 'post',

    transformInclude(id) {
      debug('transformInclude', id)

      if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
        return false
      }

      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href))
      const query = parseQuery(search)
      return /\.([c|m]?[j|t]s)$/.test(pathname) && (!!query.locale || !!query.config)
    },

    transform(code, id) {
      debug('transform', id)

      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href))
      const query = parseQuery(search)

      const s = new MagicString(code)

      function result() {
        if (s.hasChanged()) {
          return {
            code: s.toString(),
            map: options.sourcemap && !/\.([c|m]?ts)$/.test(pathname) ? s.generateMap({ hires: true }) : null
          }
        }
      }

      const pattern = query.locale ? NUXT_I18N_COMPOSABLE_DEFINE_LOCALE : NUXT_I18N_COMPOSABLE_DEFINE_CONFIG
      const match = code.match(new RegExp(`\\b${pattern}\\s*`))
      if (match?.[0]) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        s.remove(match.index!, match.index! + match[0].length)
      }

      return result()
    }
  }
})
