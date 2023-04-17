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
  NUXT_I18N_CONFIG_PROXY_ID,
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
        // console.log('resolveId (resource)', id, importer, pathname, query)
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
      } else if (pathname === NUXT_I18N_CONFIG_PROXY_ID) {
        // console.log('resolveId (config)', id, importer, pathname, query)
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
          // console.log('load (resource) ->', id, pathname, query, baseDir)
          // prettier-ignore
          const code = `import { loadResource, formatMessage } from '#build/${NUXT_I18N_TEMPLATE_INTERNAL_KEY}'
import { NUXT_I18N_PRECOMPILED_LOCALE_KEY, isSSG } from '#build/${NUXT_I18N_TEMPLATE_OPTIONS_KEY}'
export default async function(context, locale) {
  if (process.dev || process.server || !isSSG) {
    __DEBUG__ && console.log('loadResource', locale)
    const loader = await import(${JSON.stringify(`${resolve(baseDir, query.target)}?resource=true`)}).then(m => m.default || m)
    return await loadResource(context, locale, loader)
  } else {
    __DEBUG__ && console.log('load precompiled resource', locale)
    let mod = null
    try {
      mod = await import(/* @vite-ignore */ \`/\${NUXT_I18N_PRECOMPILED_LOCALE_KEY}-\${locale}.js\` /* webpackChunkName: ${query.target} */).then(
        m => m.default || m
      )
    } catch (e) {
      console.error(formatMessage(e.message))
    }
    return mod || {}
  }
}`
          const s = new MagicString(code)
          return {
            code: s.toString(),
            map: options.sourcemap ? s.generateMap({ source: id, includeContent: true }) : undefined
          }
        }
      } else if (pathname === NUXT_I18N_CONFIG_PROXY_ID) {
        if (isString(query.target) && isString(query.from)) {
          const baseDir = dirname(query.from)
          // console.log('load (config) ->', id, pathname, query, baseDir)
          // prettier-ignore
          const code = `import { precompileMessages, formatMessage } from '#build/${NUXT_I18N_TEMPLATE_INTERNAL_KEY}'
import { isSSG } from '#build/${NUXT_I18N_TEMPLATE_OPTIONS_KEY}'
import { isObject, isFunction } from '@intlify/shared'
export default async function(context) {
  const loader = await import(${JSON.stringify(`${resolve(baseDir, query.target)}?config=true`)}).then(m => m.default || m)
  const config = isFunction(loader)
    ? await loader(context)
    : isObject(loader)
      ? loader
      : {}
  __DEBUG__ && console.log('loadConfig', config)
  if (process.dev || process.server || !isSSG) {
    config.messages = await precompileMessages(config.messages, ${JSON.stringify(query.c)})
    return config
  } else {
    __DEBUG__ && console.log('already pre-compiled vue-i18n messages')
    let messages = null
    try {
      const key = \`/i18n-config-${query.c}.js\` 
      messages = await import(/* @vite-ignore */ key /* webpackChunkName: nuxt-i18n-config-${query.c} */).then(
        m => m.default || m
      )
    } catch (e) {
      console.error(formatMessage(e.message))
    }
    config.messages = messages || {}
    return config
  }
}`
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
