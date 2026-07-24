import { readFileSync } from 'node:fs'
import { detectHtmlTag } from '@intlify/message-compiler'
import { escapeHtml, isString } from '@intlify/shared'
import { parseJSON5, parseYAML } from 'confbox'
import { createUnplugin } from 'unplugin'
import { asI18nVirtual } from './utils'

import type { ResolvedI18nContext } from '../context'

const JSON_PARSE_VIRTUAL_PREFIX = '\0i18n-json-parse/'

export const STATIC_RESOURCE_RE = /\.(?:json5?|ya?ml)$/

function parseResource(path: string) {
  const content = readFileSync(path, 'utf8')
  if (path.endsWith('.json5')) { return parseJSON5(content) }
  if (/\.ya?ml$/.test(path)) { return parseYAML(content) }
  return JSON.parse(content)
}

// mirrors the `@intlify/bundle-utils` compile-time checks skipped by intercepted resources
function validateMessages(value: unknown, options: { strictMessage: boolean, escapeHtml: boolean }, path: string): unknown {
  if (isString(value)) {
    if (detectHtmlTag(value)) {
      if (options.strictMessage) {
        throw new Error(`Detected HTML in '${value}' message (${path}). Recommend not using HTML messages to avoid XSS.`)
      }
      if (options.escapeHtml) { return escapeHtml(value) }
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.map(x => validateMessages(x, options, path))
  }
  if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) {
      ;(value as Record<string, unknown>)[k] = validateMessages((value as Record<string, unknown>)[k], options, path)
    }
  }
  return value
}

/**
 * Serves static locale resources as `export default JSON.parse("...")` modules in server builds,
 * skipping bundler AST/sourcemap work over message data (precompiled message ASTs are ~3x raw size).
 * Must resolve before `ResourcePlugin`: both claim the `#nuxt-i18n/<hash>` ids at `enforce: 'pre'`.
 */
export const JsonParseMessagesPlugin = (ctx: ResolvedI18nContext) =>
  createUnplugin(() => {
    const virtualToPath = new Map<string, string>()
    for (const fileMeta of ctx.localeFileMetas) {
      if (STATIC_RESOURCE_RE.test(fileMeta.path)) {
        virtualToPath.set(asI18nVirtual(fileMeta.hash), fileMeta.path)
      }
    }

    return {
      name: 'nuxtjs:i18n-json-parse-messages',
      enforce: 'pre',
      resolveId(id) {
        if (virtualToPath.has(id)) { return JSON_PARSE_VIRTUAL_PREFIX + id }
      },
      loadInclude(id) {
        return id.startsWith(JSON_PARSE_VIRTUAL_PREFIX)
      },
      load(id) {
        const path = virtualToPath.get(id.slice(JSON_PARSE_VIRTUAL_PREFIX.length))!
        this.addWatchFile(path)
        const messages = validateMessages(parseResource(path), {
          strictMessage: ctx.options.compilation.strictMessage ?? true,
          escapeHtml: !!ctx.options.compilation.escapeHtml,
        }, path)
        const raw = JSON.stringify(messages)
        return {
          code: `export default /* @__PURE__ */ JSON.parse(${JSON.stringify(raw)})`,
          map: { version: 3, sources: [], names: [], mappings: '' },
        }
      },
    }
  })
