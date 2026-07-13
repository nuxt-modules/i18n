import { describe, expect, test } from 'vitest'
import { getNestedValue, pickNested, setNestedValue } from '../src/runtime/server/utils/messages-utils'

describe('getNestedValue', () => {
  const obj = { a: { b: { c: 1 } }, d: 'x' }

  test('resolves dot-notation paths', () => {
    expect(getNestedValue(obj, 'a.b.c')).toBe(1)
    expect(getNestedValue(obj, 'a.b')).toEqual({ c: 1 })
    expect(getNestedValue(obj, 'd')).toBe('x')
  })

  test('returns undefined for missing or non-object paths', () => {
    expect(getNestedValue(obj, 'a.x')).toBeUndefined()
    expect(getNestedValue(obj, 'd.e')).toBeUndefined()
    expect(getNestedValue(obj, 'a.b.c.d')).toBeUndefined()
  })
})

describe('setNestedValue', () => {
  test('creates intermediate objects', () => {
    const target: Record<string, unknown> = {}
    setNestedValue(target, 'a.b.c', 1)
    expect(target).toEqual({ a: { b: { c: 1 } } })
  })

  test('preserves sibling values', () => {
    const target = { a: { keep: true } }
    setNestedValue(target, 'a.b', 1)
    expect(target).toEqual({ a: { keep: true, b: 1 } })
  })
})

describe('pickNested', () => {
  const messages = { nav: { home: 'Home', about: 'About' }, footer: { legal: 'Legal' }, title: 'Site' }

  test('picks nested keys with dot notation', () => {
    expect(pickNested(['nav.home', 'title'], messages)).toEqual({ nav: { home: 'Home' }, title: 'Site' })
  })

  test('skips keys missing from the source', () => {
    expect(pickNested(['nav.missing', 'nope'], messages)).toEqual({})
  })
})
