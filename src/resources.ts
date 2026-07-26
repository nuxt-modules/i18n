import { readFileSync } from 'node:fs'
import { detectHtmlTag } from '@intlify/message-compiler'
import { escapeHtml, isString } from '@intlify/shared'
import { parseJSON5, parseYAML } from 'confbox'
import { tryUseNuxt } from '@nuxt/kit'
import { relative } from 'pathe'
import { logger } from './utils'

import type { ResolvedI18nContext } from './context'

export const STATIC_RESOURCE_RE = /\.(?:json5?|ya?ml)$/
const BOM_RE = /^\uFEFF/

function parseResource(path: string) {
  // locale files added as unwritten templates only exist in the virtual file system
  const raw = tryUseNuxt()?.vfs?.[path] ?? readFileSync(path, 'utf8')
  // the vite/rollup JSON loaders strip a byte order mark before parsing, `JSON.parse` does not
  const content = raw.replace(BOM_RE, '')
  try {
    if (path.endsWith('.json5')) { return parseJSON5(content) }
    if (/\.ya?ml$/.test(path)) { return parseYAML(content) }
    return JSON.parse(content)
  } catch (err) {
    throw new Error(`Could not parse locale file (${path}): ${(err as Error).message}`, { cause: err })
  }
}

type ValidateOptions = { strictMessage: boolean | undefined, escapeHtml: boolean, htmlKeys: string[] }

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
      if (options.strictMessage == null) { options.htmlKeys.push(keys.join('.')) }
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

const warnedPaths = new Set<string>()

function warnHtmlMessages(path: string, keys: string[]) {
  if (warnedPaths.has(path)) { return }
  warnedPaths.add(path)
  logger.warn(
    `Detected HTML in ${keys.length} message${keys.length > 1 ? 's' : ''} in `
    + `${relative(tryUseNuxt()?.options.rootDir ?? '', path)} (first: "${keys[0]}"). `
    + 'Set `compilation.strictMessage` to `true` to reject these, or to `false` to silence this warning.',
  )
}

/** parse, validate and minify a static locale resource */
export function readStaticResource(ctx: Pick<ResolvedI18nContext, 'options' | 'rawOptions'>, path: string): string {
  const htmlKeys: string[] = []
  const messages = validateMessages(parseResource(path), {
    // these resources are not precompiled, so nothing checked them before `optimizeMessageBundling` -
    // applying the `strictMessage` default here would reject messages that always built fine
    strictMessage: ctx.rawOptions.compilation?.strictMessage,
    escapeHtml: !!ctx.options.compilation.escapeHtml,
    htmlKeys,
  }, path, [])

  if (htmlKeys.length) { warnHtmlMessages(path, htmlKeys) }

  return JSON.stringify(messages)
}
