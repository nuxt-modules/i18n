/**
 * Type-level assertions for route narrowing with `experimental.typedPages` (#3962).
 *
 * Never executed, only checked by this fixture's `test:types` script — an unused
 * `@ts-expect-error` directive fails the check. The `not.toBeAny()` assertions guard
 * against the vue-router augmentation silently resolving to `any` when it references
 * types without importing them (`skipLibCheck` swallows the resolution errors).
 */
import { describe, expectTypeOf, it } from 'vitest'
import { useLocalePath, useLocaleRoute } from '#imports'
import { useRoute, useRouter } from 'vue-router'
import type { RouteLocationNamedI18n, RouteMapI18n } from 'vue-router'

describe('vue-router augmentation', () => {
  it('resolves generated route maps', () => {
    expectTypeOf<RouteMapI18n>().not.toBeAny()
    expectTypeOf<keyof RouteMapI18n>().toEqualTypeOf<'index' | 'about' | 'slug'>()
    expectTypeOf<RouteLocationNamedI18n>().not.toBeAny()
  })

  it('holds only localized names in vue-router route map', () => {
    const router = useRouter()
    router.push({ name: 'slug___en', params: { slug: 'ok' } })
    // @ts-expect-error base name must not leak into vue-router's RouteMap
    router.push({ name: 'slug' })
    // @ts-expect-error invalid route name
    router.push({ name: 'nope' })
  })
})

describe('useLocalePath', () => {
  const localePath = useLocalePath()

  it('narrows route name strings', () => {
    localePath('about')
    localePath('about', 'nl')
    // @ts-expect-error invalid route name
    localePath('nope')
  })

  it('narrows name and params of route objects', () => {
    localePath({ name: 'about' })
    localePath({ name: 'slug', params: { slug: 'ok' } })
    localePath({ name: 'about', query: { q: '1' }, hash: '#x' })
    // @ts-expect-error invalid route name
    localePath({ name: 'nope' })
    // @ts-expect-error wrong param type
    localePath({ name: 'slug', params: { slug: false } })
  })

  it('accepts plain string path objects and resolved routes', () => {
    localePath({ path: '/anything', query: { q: '1' } })
    localePath(useRoute())
  })
})

describe('useLocaleRoute', () => {
  const localeRoute = useLocaleRoute()

  it('narrows name and params of route objects', () => {
    // @ts-expect-error invalid route name
    localeRoute({ name: 'nope' })
    // @ts-expect-error wrong param type
    localeRoute({ name: 'slug', params: { slug: false } })
  })

  it('narrows the resolved route to the given name', () => {
    const resolved = localeRoute({ name: 'slug', params: { slug: 'ok' } })
    expectTypeOf(resolved).not.toBeAny()
    expectTypeOf(resolved!.name).toEqualTypeOf<'slug'>()
    expectTypeOf(resolved!.params).toEqualTypeOf<{ slug: string }>()
  })
})

describe('`NuxtLinkLocale` `to` prop', () => {
  it('narrows name and params of route objects', () => {
    expectTypeOf<{ name: 'slug'; params: { slug: 'ok' } }>().toExtend<RouteLocationNamedI18n>()
    expectTypeOf<{ path: '/anything' }>().toExtend<RouteLocationNamedI18n>()
    expectTypeOf<'about'>().toExtend<RouteLocationNamedI18n>()
    expectTypeOf<{ name: 'nope' }>().not.toExtend<RouteLocationNamedI18n>()
    expectTypeOf<{ name: 'slug'; params: { slug: boolean } }>().not.toExtend<RouteLocationNamedI18n>()
    expectTypeOf<'nope'>().not.toExtend<RouteLocationNamedI18n>()
  })
})
