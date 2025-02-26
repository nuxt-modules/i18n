import createDebug from 'debug'
import { pathToFileURL } from 'node:url'
import { createUnplugin } from 'unplugin'
import { parseQuery, parseURL } from 'ufo'
import MagicString from 'magic-string'
import { VIRTUAL_PREFIX_HEX } from './utils'
import { NUXT_I18N_COMPOSABLE_DEFINE_LOCALE, NUXT_I18N_COMPOSABLE_DEFINE_CONFIG } from '../constants'

import type { BundlerPluginOptions } from './utils'
import type { I18nNuxtContext } from '../context'
import type { Nuxt } from '@nuxt/schema'

const debug = createDebug('@nuxtjs/i18n:transform:resource')

export const ResourcePlugin = (options: BundlerPluginOptions, ctx: I18nNuxtContext, nuxt: Nuxt) =>
  createUnplugin(() => {
    debug('options', options)
    const i18nPathSet = new Set([
      ...ctx.localeInfo.flatMap(x => x.meta!.map(m => m.path)),
      ...ctx.vueI18nConfigPaths.map(x => x.absolute)
    ])
    return {
      name: 'nuxtjs:i18n-resource',
      enforce: 'post',

      // nitro support to resolve relative locale files with query parameters to absolute
      rollup: {
        resolveId(id) {
          if (!id || id.startsWith(VIRTUAL_PREFIX_HEX) || !id.startsWith('../')) {
            return
          }

          const pathname = ctx.resolver.resolve(nuxt.options.buildDir, id).split('?')[0]
          if (i18nPathSet.has(pathname)) {
            return pathname
          }
        }
      },

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
        const matches = code.matchAll(new RegExp(`\\b${pattern}\\s*`, 'g'))

        for (const match of matches) {
          s.remove(match.index, match.index + match[0].length)
        }

        return result()
      }
    }
  })
