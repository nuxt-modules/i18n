import createDebug from 'debug'
import { dirname, resolve } from 'node:path'
import { createUnplugin } from 'unplugin'
import { parseQuery, parseURL, withQuery } from 'ufo'
import { isString } from '@intlify/shared'
import MagicString from 'magic-string'
// @ts-ignore
import { transform as stripType } from '@mizchi/sucrase'
import { getVirtualId, VIRTUAL_PREFIX_HEX } from './utils'
import { toCode } from '../utils'
import {
  NUXT_I18N_TEMPLATE_OPTIONS_KEY,
  NUXT_I18N_TEMPLATE_INTERNAL_KEY,
  NUXT_I18N_CONFIG_PROXY_ID,
  NUXT_I18N_LOCALE_PROXY_ID
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
      const { pathname, search } = parseURL(decodeURIComponent(getVirtualId(id)))
      const query = parseQuery(search)

      if (pathname === NUXT_I18N_LOCALE_PROXY_ID) {
        debug('resolveId (locale)', id, importer)
        if (importer?.endsWith(NUXT_I18N_TEMPLATE_OPTIONS_KEY)) {
          return {
            id: withQuery(id, { from: importer }),
            moduleSideEffects: true
          }
        } else if (isString(query.from) && query.from.endsWith(NUXT_I18N_TEMPLATE_OPTIONS_KEY)) {
          return {
            id,
            moduleSideEffects: true
          }
        }
      } else if (pathname === NUXT_I18N_CONFIG_PROXY_ID) {
        debug('resolveId (config)', id, importer)
        if (importer?.endsWith(NUXT_I18N_TEMPLATE_OPTIONS_KEY)) {
          return {
            id: withQuery(id, { from: importer }),
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
      const { pathname, search } = parseURL(decodeURIComponent(getVirtualId(id)))
      const query = parseQuery(search)

      if (pathname === NUXT_I18N_LOCALE_PROXY_ID) {
        if (isString(query.target) && isString(query.from)) {
          const baseDir = dirname(query.from)
          debug('load (locale) ->', id, baseDir)
          // prettier-ignore
          const code = `import { precompileLocale, formatMessage } from '#build/${NUXT_I18N_TEMPLATE_INTERNAL_KEY}'
import { NUXT_I18N_PRERENDERED_PATH } from '#build/${NUXT_I18N_TEMPLATE_OPTIONS_KEY}'
export default async function(locale) {
  if (process.dev || (process.server && process.env.prerender)) {
    __DEBUG__ && console.log('loadResource', locale)
    const loader = await import(${toCode(withQuery(resolve(baseDir, query.target), { hash: query.hash, locale: query.locale }))}).then(m => m.default || m)
    const message = await loader(locale)
    return await precompileLocale(locale, message, ${toCode(query.hash)})
  } else {
    __DEBUG__ && console.log('load precompiled resource', locale)
    let mod = null
    try {
      let url = \`\${NUXT_I18N_PRERENDERED_PATH}/${query.hash}.js\`
      if (process.server) {
        url = \`../../../../public\${url}\`
      }
      mod = await import(/* @vite-ignore */ url /* webpackChunkName: ${query.hash} */).then(
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
          debug('load (config) ->', id, baseDir)
          // prettier-ignore
          const code = `import { precompileConfig, formatMessage } from '#build/${NUXT_I18N_TEMPLATE_INTERNAL_KEY}'
import { NUXT_I18N_PRERENDERED_PATH } from '#build/${NUXT_I18N_TEMPLATE_OPTIONS_KEY}'
import { isObject, isFunction } from '@intlify/shared'
export default async function() {
  const loader = await import(${toCode(withQuery(resolve(baseDir, query.target), { hash: query.hash, config: 'true' }))}).then(m => m.default || m)
  const config = isFunction(loader)
    ? await loader()
    : isObject(loader)
      ? loader
      : {}
  __DEBUG__ && console.log('loadConfig', config)
  if (process.dev || (process.server && process.env.prerender)) {
    config.messages = await precompileConfig(config.messages, ${toCode(query.hash)})
    return config
  } else {
    __DEBUG__ && console.log('already pre-compiled vue-i18n messages')
    let messages = null
    try {
      let url = \`\${NUXT_I18N_PRERENDERED_PATH}/${query.hash}.js\`
      if (process.server) {
        url = \`../../../../public\${url}\`
      }
      messages = await import(/* @vite-ignore */ url /* webpackChunkName: ${query.hash} */).then(
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
      if (id.startsWith(VIRTUAL_PREFIX_HEX) || !/\.([c|m]?ts)$/.test(id)) {
        return false
      } else {
        debug('transformInclude', id)
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
