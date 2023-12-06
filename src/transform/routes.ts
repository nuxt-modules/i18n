import createDebug from 'debug'
import { pathToFileURL } from 'node:url'
import { createUnplugin } from 'unplugin'
import { parseURL } from 'ufo'
import MagicString from 'magic-string'
import { VIRTUAL_PREFIX_HEX } from './utils'

export interface RoutesPluginOptions {
  sourcemap?: boolean
}

const debug = createDebug('@nuxtjs/i18n:transform:routes')

export const RoutesPlugin = createUnplugin((options: RoutesPluginOptions) => {
  debug('options', options)

  return {
    name: 'nuxtjs:i18n-routes',
    enforce: 'post',

    transformInclude(id) {
      debug('transformInclude', id)

      if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
        return false
      }

      return id.startsWith('virtual:nuxt:') && id.endsWith('routes.mjs')
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

      // Replace string
      // name: (fileHashVariable?.name) ?? "(routeName)(___localeSuffix)"
      s.replaceAll(
        /name:\s(?<varName>.+)\s\?\?\s"(?<routeName>.+)(?<localeSuffix>___.+)"/g,
        (_, varName, routeName, localeSuffix) =>
          `name: (${varName} ? ${varName} + "${localeSuffix}" : undefined) ?? "${routeName}${localeSuffix}"`
      )

      return result()
    }
  }
})
