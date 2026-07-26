import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { readStaticResource, resolveRawResourcePaths } from '../src/resources'
import { logger } from '../src/utils'

import type { ResolvedI18nContext } from '../src/context'

const dir = mkdtempSync(join(tmpdir(), 'i18n-resources-'))
const nuxt = { vfs: {} as Record<string, string>, options: { rootDir: dir } }

vi.mock('@nuxt/kit', async importOriginal => ({
  ...(await importOriginal<typeof import('@nuxt/kit')>()),
  tryUseNuxt: () => nuxt,
}))

function createCtx(compilation: { strictMessage?: boolean, escapeHtml?: boolean } = {}) {
  return { options: { compilation }, rawOptions: { compilation } } as unknown as Pick<
    ResolvedI18nContext,
    'options' | 'rawOptions'
  >
}

function writeResource(name: string, contents: string) {
  const path = join(dir, name)
  writeFileSync(path, contents)
  return path
}

afterEach(() => {
  nuxt.vfs = {}
  vi.restoreAllMocks()
})

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

  test('strips a byte order mark', () => {
    const path = writeResource('bom.json', '﻿{"hello":"world"}')
    expect(readStaticResource(createCtx(), path)).toBe('{"hello":"world"}')
  })

  test('reports the file path when parsing fails', () => {
    const path = writeResource('broken.json', '{"hello":')
    // string matcher - a path interpolated into a regex escapes its own separators on windows
    expect(() => readStaticResource(createCtx(), path)).toThrow(`Could not parse locale file (${path})`)
  })

  test('reads locale files from the virtual file system', () => {
    const path = join(dir, 'virtual.json')
    nuxt.vfs[path] = '{"hello":"virtual"}'

    expect(readStaticResource(createCtx(), path)).toBe('{"hello":"virtual"}')
  })

  test('throws for HTML messages when `strictMessage` is explicitly enabled', () => {
    const path = writeResource('strict.json', '{"greeting":"<b>hello</b>"}')
    expect(() => readStaticResource(createCtx({ strictMessage: true }), path)).toThrow(/Detected HTML/)
  })

  test('reports the message path of the offending message', () => {
    const ctx = createCtx({ strictMessage: true })

    const path = writeResource('nested.json', '{"a":{"b":{"c":"<b>hello</b>"}}}')
    expect(() => readStaticResource(ctx, path)).toThrow(/at "a\.b\.c"/)

    const inArray = writeResource('array.json', '{"list":["ok","<i>bad</i>"]}')
    expect(() => readStaticResource(ctx, inArray)).toThrow(/at "list\.1"/)
  })

  // these resources are not precompiled, so nothing rejected HTML in them before
  // `optimizeMessageBundling` - warn rather than break builds that have always passed
  test('warns once per file instead of throwing when `strictMessage` is not set', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const path = writeResource('warn.json', '{"a":"<b>hello</b>","b":{"c":"<i>hi</i>"},"d":"plain"}')

    expect(JSON.parse(readStaticResource(createCtx(), path)).a).toBe('<b>hello</b>')
    readStaticResource(createCtx(), path)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toContain('Detected HTML in 2 messages in warn.json (first: "a")')
  })

  test('stays silent when `strictMessage` is explicitly disabled', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const path = writeResource('silent.json', '{"greeting":"<b>hello</b>"}')

    expect(JSON.parse(readStaticResource(createCtx({ strictMessage: false }), path)).greeting).toBe('<b>hello</b>')
    expect(warn).not.toHaveBeenCalled()
  })

  test('escapes HTML when `escapeHtml` is enabled and strict is off', () => {
    const path = writeResource('escape.json', '{"greeting":"<b>hello</b>","plain":"a > b"}')
    const result = JSON.parse(readStaticResource(createCtx({ strictMessage: false, escapeHtml: true }), path))

    expect(result.greeting).toBe('&lt;b&gt;hello&lt;&#x2F;b&gt;')
    // no tag detected, left untouched - matches `@intlify/bundle-utils`
    expect(result.plain).toBe('a > b')
  })
})

describe('resolveRawResourcePaths', () => {
  test('collects static resources and ignores executable locale files', () => {
    const json = writeResource('raw-en.json', '{"hello":"world"}')
    const yaml = writeResource('raw-en.yaml', 'hello: world')
    const json5 = writeResource('raw-en.json5', '{ hello: "world" }')
    const ts = writeResource('raw-en.ts', 'export default defineI18nLocale(() => ({}))')

    expect(resolveRawResourcePaths([json, yaml, json5, ts])).toEqual(new Set([json, yaml, json5]))
  })

  test('leaves unparseable resources to the bundler instead of throwing', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const ok = writeResource('raw-ok.json', '{"hello":"world"}')
    const broken = writeResource('raw-broken.json', '{"hello":')

    expect(resolveRawResourcePaths([ok, broken])).toEqual(new Set([ok]))
    expect(warn.mock.calls[0]![0]).toContain('Leaving raw-broken.json to the bundler')
  })

  test('does not validate messages, HTML is rejected on read instead', () => {
    const path = writeResource('raw-html.json', '{"greeting":"<b>hello</b>"}')

    expect(resolveRawResourcePaths([path])).toEqual(new Set([path]))
    expect(() => readStaticResource(createCtx({ strictMessage: true }), path)).toThrow(/Detected HTML/)
  })

  test('deduplicates paths shared by several locales', () => {
    const path = writeResource('raw-shared.json', '{"hello":"world"}')

    expect(resolveRawResourcePaths([path, path])).toEqual(new Set([path]))
  })
})
