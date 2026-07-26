import { describe, expect, test } from 'vitest'
import { deepCopy } from '@intlify/shared'
import { createI18n } from 'vue-i18n'
import { createMessageInstaller } from '../src/runtime/context'
import { getComposer } from '../src/runtime/compatibility'
import { cloneDeep, fillMissing, hasMessageFunction } from '../src/runtime/shared/messages'

import type { Composer } from 'vue-i18n'

type Store = Record<string, Record<string, unknown>>

// stand-in with vue-i18n's semantics: set assigns by reference, merge deep copies into the target
function createFakeComposer() {
  const store: Store = {}
  return {
    store,
    getLocaleMessage: (locale: string) => store[locale] || {},
    setLocaleMessage: (locale: string, message: Record<string, unknown>) => {
      store[locale] = message
    },
    mergeLocaleMessage: (locale: string, message: Record<string, unknown>) => {
      store[locale] ||= {}
      deepCopy(message, store[locale])
    },
  } as unknown as Pick<Composer, 'getLocaleMessage' | 'setLocaleMessage' | 'mergeLocaleMessage'> & { store: Store }
}

function cachedTree() {
  const tree = { greeting: 'hello', nested: { deep: 'value' }, list: ['a', 'b'] }
  Object.freeze(tree.nested)
  Object.freeze(tree.list)
  return Object.freeze(tree)
}

describe('createMessageInstaller', () => {
  test('installs into an empty locale by reference', () => {
    const i18n = createFakeComposer()
    const install = createMessageInstaller(i18n)
    const cached = cachedTree()

    install('en', cached)
    expect(i18n.store.en).toBe(cached)
  })

  test('keeps messages a locale already has, without copying the installed tree', () => {
    const i18n = createFakeComposer()
    const install = createMessageInstaller(i18n)
    i18n.setLocaleMessage('en', { fromConfig: 'keep' })
    const cached = cachedTree()

    install('en', cached)

    expect(i18n.store.en.fromConfig).toBe('keep')
    expect(i18n.store.en.greeting).toBe('hello')
    // the point of filling underneath - the loaded subtrees stay shared with the cache
    expect(i18n.store.en.nested).toBe(cached.nested)
    expect(i18n.store.en.list).toBe(cached.list)
  })

  test('loaded messages win over the ones already present', () => {
    const i18n = createFakeComposer()
    const install = createMessageInstaller(i18n)
    i18n.setLocaleMessage('en', { greeting: 'from config', nested: { deep: 'from config', extra: 'kept' } })

    install('en', cachedTree())

    expect(i18n.store.en.greeting).toBe('hello')
    expect(i18n.store.en.nested).toEqual({ deep: 'value', extra: 'kept' })
  })

  test('message functions from the config survive the install', () => {
    const i18n = createFakeComposer()
    const install = createMessageInstaller(i18n)
    const fn = () => 'from a function'
    i18n.setLocaleMessage('en', { fn })

    install('en', cachedTree())

    expect(i18n.store.en.fn).toBe(fn)
  })

  test('merging after a by-reference install copies first', () => {
    const i18n = createFakeComposer()
    const install = createMessageInstaller(i18n)
    const cached = cachedTree()

    install('en', cached)
    i18n.mergeLocaleMessage('en', { added: 'x' })

    expect(i18n.store.en).not.toBe(cached)
    expect(i18n.store.en.added).toBe('x')
    expect(i18n.store.en.greeting).toBe('hello')
    expect('added' in cached).toBe(false)
  })

  test('the copy does not alias arrays of the installed tree', () => {
    const i18n = createFakeComposer()
    const install = createMessageInstaller(i18n)
    const cached = cachedTree()

    install('en', cached)
    i18n.mergeLocaleMessage('en', { added: 'x' })

    const list = i18n.store.en.list as string[]
    expect(list).not.toBe(cached.list)
    list.push('c')
    expect(cached.list).toEqual(['a', 'b'])
  })

  test('only copies once per install', () => {
    const i18n = createFakeComposer()
    const install = createMessageInstaller(i18n)

    install('en', cachedTree())
    i18n.mergeLocaleMessage('en', { a: '1' })
    const afterFirst = i18n.store.en
    i18n.mergeLocaleMessage('en', { b: '2' })

    expect(i18n.store.en).toBe(afterFirst)
    expect(i18n.store.en).toMatchObject({ a: '1', b: '2' })
  })

  test('setLocaleMessage replaces the reference without copying', () => {
    const i18n = createFakeComposer()
    const install = createMessageInstaller(i18n)
    install('en', cachedTree())

    const replacement = { fresh: 'tree' }
    i18n.setLocaleMessage('en', replacement)
    i18n.mergeLocaleMessage('en', { more: 'z' })

    expect(i18n.store.en).toBe(replacement)
    expect(replacement).toEqual({ fresh: 'tree', more: 'z' })
  })

  test('leaves locales it never installed alone', () => {
    const i18n = createFakeComposer()
    createMessageInstaller(i18n)

    i18n.mergeLocaleMessage('fr', { salut: 'y' })
    expect(i18n.store.fr.salut).toBe('y')
  })

  // in legacy mode `useI18n()` reaches the composer while `$i18n` goes through the VueI18n
  // facade - patching the composer has to cover both
  test('a legacy VueI18n instance protects composer and facade merges alike', () => {
    const i18n = createI18n({ legacy: true, locale: 'en', messages: { en: {} } })
    const install = createMessageInstaller(getComposer(i18n))
    const cached = cachedTree()

    install('en', cached)
    getComposer(i18n).mergeLocaleMessage('en', { viaComposer: 'x' })
    i18n.global.mergeLocaleMessage('en', { viaFacade: 'y' })

    expect(cached).toEqual({ greeting: 'hello', nested: { deep: 'value' }, list: ['a', 'b'] })
    expect(i18n.global.getLocaleMessage('en')).toMatchObject({ viaComposer: 'x', viaFacade: 'y' })
  })
})

describe('fillMissing', () => {
  test('returns the same reference when there is nothing to fill', () => {
    const over = { a: '1' }
    expect(fillMissing(over, {})).toBe(over)
    expect(fillMissing(over, { a: '2' })).toBe(over)
  })

  test('only copies the levels it touches', () => {
    const over = { keep: { deep: 'x' }, shared: { deep: 'y' } }
    const out = fillMissing(over, { keep: { added: 'z' } })

    expect(out).not.toBe(over)
    expect(out.keep).not.toBe(over.keep)
    expect(out.shared).toBe(over.shared)
    expect(out).toEqual({ keep: { deep: 'x', added: 'z' }, shared: { deep: 'y' } })
  })

  test('never writes into either input', () => {
    const over = Object.freeze({ a: Object.freeze({ x: '1' }) })
    const base = { a: { y: '2' }, b: '3' }

    expect(fillMissing(over, base)).toEqual({ a: { x: '1', y: '2' }, b: '3' })
    expect(over).toEqual({ a: { x: '1' } })
    expect(base).toEqual({ a: { y: '2' }, b: '3' })
  })

  test('fills keys that collide with prototype members', () => {
    // `over` comes from JSON.parse in production, so it carries Object.prototype
    expect(fillMissing({ a: '1' }, { toString: 'a message', constructor: 'another' })).toMatchObject({
      a: '1',
      toString: 'a message',
      constructor: 'another'
    })
  })

  test('a non-object on either side is not merged into', () => {
    expect(fillMissing({ a: 'str' }, { a: { deep: 'x' } })).toEqual({ a: 'str' })
    expect(fillMissing({ a: { deep: 'x' } }, { a: 'str' })).toEqual({ a: { deep: 'x' } })
    expect(fillMissing({ a: ['x'] }, { a: ['y', 'z'] })).toEqual({ a: ['x'] })
  })
})

describe('hasMessageFunction', () => {
  test('finds functions at any depth', () => {
    expect(hasMessageFunction({ a: { b: () => 'x' } })).toBe(true)
    expect(hasMessageFunction({ list: ['x', () => 'y'] })).toBe(true)
  })

  test('plain trees pass', () => {
    expect(hasMessageFunction({ a: 'x', n: 1, deep: { b: 'y' }, list: ['z'] })).toBe(false)
  })
})

describe('cloneDeep', () => {
  test('copies nested objects and arrays, keeps primitives and functions', () => {
    const fn = () => 'msg'
    const src = { a: { b: [1, { c: 2 }] }, d: fn, e: null, f: 'str' }
    const out = cloneDeep(src)

    expect(out).not.toBe(src)
    expect(out.a).not.toBe(src.a)
    expect(out.a.b).not.toBe(src.a.b)
    expect(out.a.b[1]).not.toBe(src.a.b[1])
    expect(out.d).toBe(fn)
    expect(out).toEqual(src)
  })

  test('the clone of a frozen tree is mutable throughout', () => {
    const out = cloneDeep(cachedTree())

    expect(Object.isFrozen(out)).toBe(false)
    ;(out.nested as Record<string, string>).deep = 'changed'
    ;(out.list as string[]).push('c')
    expect(out.nested.deep).toBe('changed')
  })
})
