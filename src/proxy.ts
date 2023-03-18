import createDebug from 'debug'
import { dirname, resolve } from 'node:path'
import { createUnplugin } from 'unplugin'
import { parseQuery, parseURL } from 'ufo'
import { isString } from '@intlify/shared'
import MagicString from 'magic-string'
// @ts-ignore
import { transform as stripType } from '@mizchi/sucrase'
import {
  NUXT_I18N_TEMPLATE_OPTIONS_KEY,
  NUXT_I18N_TEMPLATE_INTERNAL_KEY,
  NUXT_I18N_RESOURCE_PROXY_ID
} from './constants'

import type { UnpluginContextMeta } from 'unplugin'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ResourceProxyPluginOptions {}

const debug = createDebug('@nuxtjs/i18n:proxy')

export const VIRTUAL_PREFIX = '\0' as const

export function getVirtualId(id: string, framework: UnpluginContextMeta['framework'] = 'vite') {
  // prettier-ignore
  return framework === 'vite'
    ? id.startsWith(VIRTUAL_PREFIX)
      ? id.slice(VIRTUAL_PREFIX.length)
      : ''
    : id
}

export function asVirtualId(id: string, framework: UnpluginContextMeta['framework'] = 'vite') {
  return framework === 'vite' ? VIRTUAL_PREFIX + id : id
}

export const ResourceProxyPlugin = createUnplugin((options: ResourceProxyPluginOptions = {}, meta) => {
  debug('options', options, meta)

  return {
    name: 'nuxtjs:i18n-resource-proxy',

    resolveId(id, importer) {
      debug('resolveId', id, importer)
      const { pathname, search } = parseURL(decodeURIComponent(getVirtualId(id)))
      const query = parseQuery(search)

      if (pathname === NUXT_I18N_RESOURCE_PROXY_ID) {
        // console.log('resolveId', id, importer, pathname, query)
        if (importer?.endsWith(NUXT_I18N_TEMPLATE_OPTIONS_KEY)) {
          return {
            id: `${id}&from=${importer}`,
            moduleSideEffects: true
          }
        } else if (isString(query.from) && query.from.endsWith(NUXT_I18N_TEMPLATE_OPTIONS_KEY)) {
          return {
            id,
            moduleSideEffects: true
          }
        }
      }

      return null
    },

    async load(id) {
      debug('load', id)
      const { pathname, search } = parseURL(decodeURIComponent(getVirtualId(id)))
      const query = parseQuery(search)

      if (pathname === NUXT_I18N_RESOURCE_PROXY_ID && isString(query.target) && isString(query.from)) {
        const baseDir = dirname(query.from)
        // console.log('load ->', id, pathname, query, baseDir)
        const code = `import { precompileResource } from '#build/${NUXT_I18N_TEMPLATE_INTERNAL_KEY}'
export default async function(context, locale) {
  const loader = await import(${JSON.stringify(resolve(baseDir, query.target))}).then(m => m.default || m)
  return await precompileResource(context, locale, loader)
}`
        // console.log(`code ->`, code)
        return {
          code,
          map: { mappings: '' }
        }
      }
    },

    transformInclude(id) {
      debug('transformInclude', id)

      if (id.startsWith('\x00') || !/\.([c|m]?ts)$/.test(id)) {
        return false
      } else {
        return true
      }
    },

    transform(code, id) {
      debug('transform', id)

      const out = stripType(code, {
        transforms: ['jsx'],
        keepUnusedImports: true
      })

      const s = new MagicString(out.code)

      return {
        code: s.toString(),
        map: s.generateMap({ source: id, includeContent: true })
      }
    }
  }
})
