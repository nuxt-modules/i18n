import { describe, expect, test } from 'vitest'
import { encodePath } from '../src/runtime/shared/utils'

describe('encodePath', () => {
  test('encodes raw non-ASCII characters', () => {
    expect(encodePath('/ja/約')).toBe('/ja/%E7%B4%84')
  })

  test('(#4064) does not double-encode an already-encoded path', () => {
    expect(encodePath('/ja/%E7%B4%84')).toBe('/ja/%E7%B4%84')
  })

  test('(#3043) still encodes unsafe characters to prevent XSS', () => {
    const xss = `/experimental//"><script>console.log('xss')</script><`
    expect(encodePath(xss)).toBe(encodeURI(xss))
    expect(encodePath(xss)).not.toContain('<script>')
  })

  test('mixed raw and already-encoded segments only encode once', () => {
    expect(encodePath('/ja/%E7%B4%84/三')).toBe('/ja/%E7%B4%84/%E4%B8%89')
  })

  test('(#3043) encodes a lone double quote, preventing attribute breakout', () => {
    // `switch-locale-path-ssr.ts` interpolates the result directly into `href="..."`
    // without going through Vue's own attribute escaping, so this one is load-bearing
    expect(encodePath('/experimental/"onmouseover="alert(1)')).toBe('/experimental/%22onmouseover=%22alert(1)')
  })

  test("(#3043) doesn't decode an attacker's own pre-encoded payload", () => {
    // an attacker submitting `%253C` (double-encoded `<`) gets a literal `%3C` string as
    // the param value, which vue-router legitimately re-encodes to `%253C` since it
    // contains a literal `%`. The collapse must not undo that legitimate encoding.
    const payload = '/experimental/%253Cscript%253Ealert(1)%253C/script%253E'
    expect(encodePath(payload)).toBe(payload)
  })
})
