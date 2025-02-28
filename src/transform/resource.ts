import createDebug from 'debug'
import MagicString from 'magic-string'
import { pathToFileURL } from 'node:url'
import { createUnplugin } from 'unplugin'
import { parseURL } from 'ufo'
import { getHash } from '../utils'
import { VIRTUAL_PREFIX_HEX } from './utils'
import { NUXT_I18N_COMPOSABLE_DEFINE_LOCALE, NUXT_I18N_COMPOSABLE_DEFINE_CONFIG } from '../constants'

import type { BundlerPluginOptions } from './utils'
import type { I18nNuxtContext } from '../context'
import type { Nuxt } from '@nuxt/schema'

const debug = createDebug('@nuxtjs/i18n:transform:resource')

export const ResourcePlugin = (options: BundlerPluginOptions, ctx: I18nNuxtContext, _nuxt: Nuxt) =>
  createUnplugin(() => {
    debug('options', options)
    const i18nPathSet = new Set([
      ...ctx.localeInfo.flatMap(x => x.meta!.map(m => m.path)),
      ...ctx.vueI18nConfigPaths.map(x => x.absolute)
    ])

    const i18nFileHashSet = new Map<string, string>()

    for (const f of Array.from(i18nPathSet)) {
      i18nFileHashSet.set(`virtual:nuxt-i18n-${getHash(f)}`, f)
    }

    return {
      name: 'nuxtjs:i18n-resource',
      enforce: 'pre',

      resolveId(id) {
        if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
          return
        }

        if (i18nFileHashSet.has(id)) {
          return i18nFileHashSet.get(id)
        }
      },

      transformInclude(id) {
        debug('transformInclude', id)

        if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
          return false
        }

        if (i18nPathSet.has(id)) {
          return /\.([c|m]?[j|t]s)$/.test(id)
        }

        if (i18nFileHashSet.has(id)) {
          return /\.([c|m]?[j|t]s)$/.test(i18nFileHashSet.get(id)!)
        }
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

        /**
         * Match and replace `defineI18nX(<content>)` with its `<content>`
         */
        const pattern = [NUXT_I18N_COMPOSABLE_DEFINE_LOCALE, NUXT_I18N_COMPOSABLE_DEFINE_CONFIG].join('|')
        const matches = code.matchAll(new RegExp(`\\b(${pattern})\\((.+)\\)`, 'gms'))
        for (const match of matches) {
          s.overwrite(match.index, match.index + match[0].length, match[2])
        }

        return result()
      }
    }
  })
