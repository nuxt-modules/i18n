import { describe, expect, test } from 'vitest'
import { deepCopy } from '@intlify/shared'
import { createMessageSharer } from '../src/runtime/context'
import { cloneDeep } from '../src/runtime/shared/messages'

import type { Composer } from 'vue-i18n'

// minimal composer stand-in with vue-i18n's real semantics: set assigns by reference,
// merge deep-copies into the stored tree via @intlify/shared `deepCopy`
function createFakeComposer() {
  const store: Record<string, Record<string, unknown>> = {}
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
  } as unknown as Pick<Composer, 'getLocaleMessage' | 'setLocaleMessage' | 'mergeLocaleMessage'> & {
    store: Record<string, Record<string, unknown>>
  }
}

function frozenTree() {
  const tree = { greeting: 'hello', nested: { deep: 'value' }, list: ['a', 'b'] }
  Object.freeze(tree.nested)
  Object.freeze(tree.list)
  return Object.freeze(tree)
}

describe('createMessageSharer', () => {
  test('share hands the object to the store by reference', () => {
    const i18n = createFakeComposer()
    const share = createMessageSharer(i18n)
    const cached = frozenTree()

    share('en', cached)
    expect(i18n.store.en).toBe(cached)
  })

  test('merge into a shared locale copies first and leaves the shared object untouched', () => {
    const i18n = createFakeComposer()
    const share = createMessageSharer(i18n)
    const cached = frozenTree()

    share('en', cached)
    i18n.mergeLocaleMessage('en', { added: 'x' })

    expect(i18n.store.en).not.toBe(cached)
    expect(i18n.store.en.added).toBe('x')
    expect(i18n.store.en.greeting).toBe('hello')
    expect('added' in cached).toBe(false)
  })

  test('the private copy does not alias arrays of the shared object', () => {
    const i18n = createFakeComposer()
    const share = createMessageSharer(i18n)
    const cached = frozenTree()

    share('en', cached)
    i18n.mergeLocaleMessage('en', { added: 'x' })

    const list = i18n.store.en.list as string[]
    expect(list).not.toBe(cached.list)
    list.push('c')
    expect(cached.list).toEqual(['a', 'b'])
  })

  test('merge into a non-shared locale passes through without copying', () => {
    const i18n = createFakeComposer()
    createMessageSharer(i18n)

    i18n.mergeLocaleMessage('fr', { salut: 'y' })
    expect(i18n.store.fr.salut).toBe('y')
  })

  test('setLocaleMessage un-shares without copying', () => {
    const i18n = createFakeComposer()
    const share = createMessageSharer(i18n)
    const cached = frozenTree()
    share('en', cached)

    const replacement = { fresh: 'tree' }
    i18n.setLocaleMessage('en', replacement)
    expect(i18n.store.en).toBe(replacement)

    // merging afterwards must not clone (locale is no longer marked shared)
    i18n.mergeLocaleMessage('en', { more: 'z' })
    expect(i18n.store.en).toBe(replacement)
    expect(replacement).toEqual({ fresh: 'tree', more: 'z' })
  })

  test('sharing again after un-share re-arms the copy-on-write', () => {
    const i18n = createFakeComposer()
    const share = createMessageSharer(i18n)
    const cached = frozenTree()

    share('en', cached)
    i18n.mergeLocaleMessage('en', { a: '1' })
    share('en', cached)
    i18n.mergeLocaleMessage('en', { b: '2' })

    expect('b' in cached).toBe(false)
    expect(i18n.store.en.b).toBe('2')
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

  test('clone of a frozen tree is mutable throughout', () => {
    const out = cloneDeep(frozenTree())
    expect(Object.isFrozen(out)).toBe(false)
    ;(out.nested as Record<string, string>).deep = 'changed'
    ;(out.list as string[]).push('c')
    expect(out.nested.deep).toBe('changed')
  })
})
