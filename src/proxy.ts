import createDebug from 'debug'
import { pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createUnplugin } from 'unplugin'
import { parseQuery, parseURL } from 'ufo'
import { createFilter } from '@rollup/pluginutils'
import { NUXT_I18N_RESOURCE_PROXY_ID } from './constants'

import type { UnpluginContextMeta } from 'unplugin'

export interface ResourceProxyPluginOptions {
  include?: string | string[]
}

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
  const filter = createFilter(options.include)

  return {
    name: 'nuxtjs:i18n-resource-proxy',

    resolveId(id, importer) {
      debug('resolveId', id, importer)
      if (importer?.endsWith('i18n.options.mjs')) {
        const { pathname, search } = parseURL(decodeURIComponent(getVirtualId(id)))
        const query = parseQuery(search)
        console.log('resolveId', id, pathname, query, pathname === NUXT_I18N_RESOURCE_PROXY_ID)

        if (pathname === NUXT_I18N_RESOURCE_PROXY_ID) {
          return `${id}&importer=${importer}`
        }
        // return asVirtualId(id, meta.framework)
      }
    },

    async load(id) {
      debug('load', id)
      const { pathname, search } = parseURL(decodeURIComponent(getVirtualId(id)))
      const query = parseQuery(search)
      console.log('load ->', id, pathname, query, pathname === NUXT_I18N_RESOURCE_PROXY_ID)

      if (pathname === NUXT_I18N_RESOURCE_PROXY_ID) {
        console.log('load ...')
        // TODO:
        const baseDir = dirname(query.importer)
        return {
          code: `
export default async function(context, locale) {
  const res = await import(${JSON.stringify(resolve(baseDir, query.import))}).then(m => m.default || m)(context, locale)
  // const res = await load(context, locale)
  return Promise.resolve(res)
}`,
          map: { mappings: '' }
        }
      }
    }

    // transformInclude(id) {
    //   debug('transformInclude', id)
    //   // sconst { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href))
    //   return NUXT_I18N_RESOURCE_PROXY_ID !== getVirtualId(id, meta.framework)
    // }
  }
})
