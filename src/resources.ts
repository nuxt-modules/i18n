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

type ValidateOptions = { strictMessage: boolean, escapeHtml: boolean }

// mirrors the `@intlify/bundle-utils` compile-time checks skipped for resources that are not
// precompiled - `keys` tracks the message path for errors and is mutated to avoid copying it per node
function validateMessages(value: unknown, options: ValidateOptions, path: string, keys: string[]): unknown {
  if (isString(value)) {
    if (detectHtmlTag(value)) {
      if (options.strictMessage) {
        throw new Error(
          `Detected HTML in '${value}' message at "${keys.join('.')}" (${path}).`
          + ` Recommend not using HTML messages to avoid XSS.`,
        )
      }
      if (options.escapeHtml) { return escapeHtml(value) }
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.map((entry, i) => {
      keys.push(String(i))
      const validated = validateMessages(entry, options, path, keys)
      keys.pop()
      return validated
    })
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const k of Object.keys(record)) {
      keys.push(k)
      record[k] = validateMessages(record[k], options, path, keys)
      keys.pop()
    }
  }
  return value
}

/** parse, validate and minify a static locale resource */
export function readStaticResource(ctx: Pick<ResolvedI18nContext, 'options'>, path: string): string {
  const messages = validateMessages(parseResource(path), {
    strictMessage: ctx.options.compilation.strictMessage ?? true,
    escapeHtml: !!ctx.options.compilation.escapeHtml,
  }, path, [])
  return JSON.stringify(messages)
}
