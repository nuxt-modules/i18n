import createDebug from 'debug'
import { pathToFileURL } from 'node:url'
// import { parse as parsePath, resolve, relative, dirname } from 'node:path'
import { createUnplugin } from 'unplugin'
import { parseQuery, parseURL } from 'ufo'
import MagicString from 'magic-string'
import { VIRTUAL_PREFIX_HEX } from './utils'
import { NUXT_I18N_COMPOSABLE_DEFINE_LOCALE, NUXT_I18N_COMPOSABLE_DEFINE_CONFIG } from '../constants'

import type { PrerenderTargets, PrerenderTarget } from '../utils'

export interface ResourceDynamicPluginOptions {
  prerenderTargs: PrerenderTargets
  dev?: boolean
  sourcemap?: boolean
}

type ResourceMapValue = Pick<PrerenderTarget, 'type'> & { ref: string; locale?: string }

const debug = createDebug('@nuxtjs/i18n:transform:dynamic')

export const ResourceDynamicPlugin = createUnplugin((options: ResourceDynamicPluginOptions) => {
  debug('options', options)

  const resoucesMap = new Map<string, ResourceMapValue>()
  // const relativeToSrcDir = (path: string) => relative(options.srcDir, path)

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
      return /\.([c|m]?[j|t]s)$/.test(pathname) && !!query.hash && (!!query.locale || !!query.config)
    },

    transform(code, id) {
      debug('transform', id)

      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href))
      const query = parseQuery(search)
      const hash = query.hash as string

      const s = new MagicString(code)

      function result() {
        if (s.hasChanged()) {
          return {
            code: s.toString(),
            map:
              options.sourcemap && !/\.([c|m]?ts)$/.test(pathname)
                ? s.generateMap({ source: id, includeContent: true })
                : undefined
          }
        }
      }

      const pattern = query.locale ? NUXT_I18N_COMPOSABLE_DEFINE_LOCALE : NUXT_I18N_COMPOSABLE_DEFINE_CONFIG
      const match = code.match(new RegExp(`\\b${pattern}\\s*`))
      if (match?.[0]) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        s.remove(match.index!, match.index! + match[0].length)
      }

      if (!options.dev) {
        const ref = this.emitFile({
          // @ts-expect-error
          type: 'chunk',
          id
        }) as unknown as string

        resoucesMap.set(hash, {
          type: query.locale ? 'locale' : 'config',
          locale: query.locale as string,
          ref
        })
      }

      return result()
    },

    vite: {
      generateBundle(outputOptions) {
        // console.log('generateBundle: outputOptions', outputOptions)
        const resources = [...resoucesMap].reduce((obj, [hash, { type, locale, ref }]) => {
          obj[hash] = { type, locale, path: this.getFileName(ref) }
          return obj
        }, {} as Record<string, Omit<ResourceMapValue, 'ref'> & { path: string }>)
        debug('generateBundle: resources', resources)

        this.emitFile({
          type: 'asset',
          fileName: 'i18n-meta.json',
          name: 'i18n-meta.json',
          source: JSON.stringify(resources, null, 2)
        })
      }
    }
  }
})
