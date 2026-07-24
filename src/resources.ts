import { readFileSync } from 'node:fs'
import { detectHtmlTag } from '@intlify/message-compiler'
import { escapeHtml, isString } from '@intlify/shared'
import { parseJSON5, parseYAML } from 'confbox'

import type { ResolvedI18nContext } from './context'

export const STATIC_RESOURCE_RE = /\.(?:json5?|ya?ml)$/

function parseResource(path: string) {
  const content = readFileSync(path, 'utf8')
  if (path.endsWith('.json5')) { return parseJSON5(content) }
  if (/\.ya?ml$/.test(path)) { return parseYAML(content) }
  return JSON.parse(content)
}

// mirrors the `@intlify/bundle-utils` compile-time checks skipped for resources that are not precompiled
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

/** parse, validate and minify a static locale resource */
export function readStaticResource(ctx: Pick<ResolvedI18nContext, 'options'>, path: string): string {
  const messages = validateMessages(parseResource(path), {
    strictMessage: ctx.options.compilation.strictMessage ?? true,
    escapeHtml: !!ctx.options.compilation.escapeHtml,
  }, path)
  return JSON.stringify(messages)
}
