import createDebug from 'debug'
import { dirname, resolve } from 'node:path'
import { createUnplugin } from 'unplugin'
import { parseQuery, parseURL } from 'ufo'
import { isString } from '@intlify/shared'
import MagicString from 'magic-string'
// @ts-ignore
import { transform as stripType } from '@mizchi/sucrase'
import { getVirtualId, VIRTUAL_PREFIX_HEX } from './utils'
import {
  NUXT_I18N_TEMPLATE_OPTIONS_KEY,
  NUXT_I18N_TEMPLATE_INTERNAL_KEY,
  NUXT_I18N_RESOURCE_PROXY_ID
} from '../constants'

export interface ResourceProxyPluginOptions {
  sourcemap?: boolean
}

const debug = createDebug('@nuxtjs/i18n:transform:proxy')

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

      if (pathname === NUXT_I18N_RESOURCE_PROXY_ID) {
        if (isString(query.target) && isString(query.from)) {
          const baseDir = dirname(query.from)
          // console.log('load ->', id, pathname, query, baseDir)
          // prettier-ignore
          const code = `import { loadResource, formatMessage } from '#build/${NUXT_I18N_TEMPLATE_INTERNAL_KEY}'
import { NUXT_I18N_PRECOMPILED_LOCALE_KEY, isSSG } from '#build/${NUXT_I18N_TEMPLATE_OPTIONS_KEY}'
export default async function(context, locale) {
  if (process.dev || process.server || !isSSG) {
    __DEBUG__ && console.log('loadResource', locale)
    const loader = await import(${JSON.stringify(`${resolve(baseDir, query.target)}?dynamic=true`)}).then(m => m.default || m)
    return await loadResource(context, locale, loader)
  } else {
    __DEBUG__ && console.log('load precompiled resource', locale)
    let mod = null
    try {
      mod = await import(/* @vite-ignore */ \`/\${NUXT_I18N_PRECOMPILED_LOCALE_KEY}-\${locale}.js\`).then(
        m => m.default || m
      )
    } catch (e) {
      console.error(format(e.message))
    }
    return mod || {}
  }
}`
          // console.log(`code ->`, code)

          const s = new MagicString(code)
          return {
            code: s.toString(),
            map: options.sourcemap ? s.generateMap({ source: id, includeContent: true }) : undefined
          }
        }
      }
    },

    transformInclude(id) {
      debug('transformInclude', id)

      if (id.startsWith(VIRTUAL_PREFIX_HEX) || !/\.([c|m]?ts)$/.test(id)) {
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
        map: options.sourcemap ? s.generateMap({ source: id, includeContent: true }) : undefined
      }
    }
  }
})
