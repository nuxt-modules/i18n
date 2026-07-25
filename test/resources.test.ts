import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { readStaticResource } from '../src/resources'

import type { ResolvedI18nContext } from '../src/context'

const dir = mkdtempSync(join(tmpdir(), 'i18n-resources-'))

function createCtx(compilation: { strictMessage?: boolean, escapeHtml?: boolean } = {}) {
  return { options: { compilation } } as unknown as Pick<ResolvedI18nContext, 'options'>
}

function writeResource(name: string, contents: string) {
  const path = join(dir, name)
  writeFileSync(path, contents)
  return path
}

describe('readStaticResource', () => {
  test('minifies json', () => {
    const path = writeResource('en.json', '{\n  "hello": "world"\n}')
    expect(readStaticResource(createCtx(), path)).toBe('{"hello":"world"}')
  })

  test('parses json5 and yaml into json', () => {
    const json5 = writeResource('en.json5', '{ hello: "world" /* comment */ }')
    expect(readStaticResource(createCtx(), json5)).toBe('{"hello":"world"}')

    const yaml = writeResource('en.yaml', 'hello: world\nnested:\n  key: value\n')
    expect(readStaticResource(createCtx(), yaml)).toBe('{"hello":"world","nested":{"key":"value"}}')
  })

  test('keeps non-string values as-is', () => {
    const path = writeResource('values.json', '{"n":1,"b":true,"nil":null,"list":["a","b"]}')
    expect(readStaticResource(createCtx(), path)).toBe('{"n":1,"b":true,"nil":null,"list":["a","b"]}')
  })

  test('throws for HTML messages when `strictMessage` is enabled (the default)', () => {
    const path = writeResource('strict.json', '{"greeting":"<b>hello</b>"}')
    expect(() => readStaticResource(createCtx(), path)).toThrow(/Detected HTML/)
  })

  test('reports the message path of the offending message', () => {
    const path = writeResource('nested.json', '{"a":{"b":{"c":"<b>hello</b>"}}}')
    expect(() => readStaticResource(createCtx(), path)).toThrow(/at "a\.b\.c"/)

    const inArray = writeResource('array.json', '{"list":["ok","<i>bad</i>"]}')
    expect(() => readStaticResource(createCtx(), inArray)).toThrow(/at "list\.1"/)
  })

  test('escapes HTML when `escapeHtml` is enabled and strict is off', () => {
    const path = writeResource('escape.json', '{"greeting":"<b>hello</b>","plain":"a > b"}')
    const result = JSON.parse(readStaticResource(createCtx({ strictMessage: false, escapeHtml: true }), path))

    expect(result.greeting).toBe('&lt;b&gt;hello&lt;&#x2F;b&gt;')
    // no tag detected, left untouched - matches `@intlify/bundle-utils`
    expect(result.plain).toBe('a > b')
  })

  test('leaves HTML untouched when both checks are disabled', () => {
    const path = writeResource('loose.json', '{"greeting":"<b>hello</b>"}')
    const ctx = createCtx({ strictMessage: false, escapeHtml: false })

    expect(JSON.parse(readStaticResource(ctx, path)).greeting).toBe('<b>hello</b>')
  })
})
