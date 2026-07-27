import { describe, expect, test } from 'vitest'
import { deepCopy } from '@intlify/shared'
import { createI18n } from 'vue-i18n'
import { createMessageInstaller } from '../src/runtime/context'
import { getComposer } from '../src/runtime/compatibility'
import { cloneDeep } from '../src/runtime/shared/messages'

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

  test('merges into a locale that already has messages', () => {
    const i18n = createFakeComposer()
    const install = createMessageInstaller(i18n)
    i18n.setLocaleMessage('en', { fromConfig: 'keep' })

    install('en', cachedTree())

    expect(i18n.store.en.fromConfig).toBe('keep')
    expect(i18n.store.en.greeting).toBe('hello')
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
