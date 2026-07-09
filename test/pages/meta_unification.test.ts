import { resolve } from 'node:path'
import { describe, test, expect } from 'vitest'
import { localizeRoutes } from '../../src/routing'
import { getRouteOptionsResolver, analyzeNuxtPages, normalizeRouteMeta, NuxtPageAnalyzeContext } from '../../src/pages'
import { getNuxtOptions } from './utils'

import type { NuxtPage } from '@nuxt/schema'

const localeCodes = ['en', 'ja', 'fr']

function localize(pages: NuxtPage[], options: ReturnType<typeof getNuxtOptions>) {
  const ctx = new NuxtPageAnalyzeContext(options.pages)
  analyzeNuxtPages(ctx, 'pages', pages)
  normalizeRouteMeta(ctx, pages, localeCodes, options.customRoutes!)
  return localizeRoutes(pages, {
    ...options,
    includeUnprefixedFallback: false,
    optionsResolver: getRouteOptionsResolver(ctx, options.defaultLocale!, options.customRoutes!),
  } as Parameters<typeof localizeRoutes>[1])
}

describe('normalizeRouteMeta', () => {
  test('normalizes `pages` config into route meta', () => {
    const pages: NuxtPage[] = [
      { path: '/about', file: '/path/to/nuxt-app/pages/about.vue', children: [] },
      { path: '/blocked', file: '/path/to/nuxt-app/pages/blocked.vue', children: [] },
    ]
    const options = getNuxtOptions({
      about: { en: '/about-us', fr: '/a-propos', ja: false },
      blocked: false,
    })

    const ctx = new NuxtPageAnalyzeContext(options.pages)
    analyzeNuxtPages(ctx, 'pages', pages)
    normalizeRouteMeta(ctx, pages, localeCodes, 'config')

    expect(pages[0]!.meta?.i18n).toEqual({
      paths: { en: '/about-us', fr: '/a-propos' },
      locales: ['en', 'fr'],
    })
    expect(pages[1]!.meta?.i18n).toBe(false)
  })

  test('normalizes `defineI18nRoute()` into route meta', () => {
    const pages: NuxtPage[] = [
      {
        path: '/about',
        file: resolve(__dirname, '../fixtures/custom_route/simple/pages/about.vue'),
        children: [],
      },
      {
        path: '/disabled',
        file: resolve(__dirname, '../fixtures/ignore_route/disable/pages/about.vue'),
        children: [],
      },
    ]
    const options = getNuxtOptions({}, 'page')

    const ctx = new NuxtPageAnalyzeContext(options.pages)
    analyzeNuxtPages(ctx, 'pages', pages)
    normalizeRouteMeta(ctx, pages, localeCodes, 'page')

    expect(pages[0]!.meta?.i18n).toEqual({
      paths: { en: '/about-us', fr: '/a-propos', ja: '/about-ja' },
    })
    expect(pages[1]!.meta?.i18n).toBe(false)
  })

  test('existing meta takes precedence over `pages` config', () => {
    const pages: NuxtPage[] = [
      {
        name: 'about',
        path: '/about',
        file: '/path/to/nuxt-app/pages/about.vue',
        meta: { i18n: { paths: { fr: '/meta-wins' } } },
        children: [],
      },
    ]
    const options = getNuxtOptions({ about: { fr: '/config-loses' } })

    const localized = localize(pages, options)
    const fr = localized.find(x => x.name === 'about___fr')
    expect(fr?.path).toBe('/fr/meta-wins')
  })

  test('meta `i18n: false` disables localization in `config` mode (#3951)', () => {
    const pages: NuxtPage[] = [
      {
        name: 'cms-dashboard',
        path: '/dashboard/:catchAll(.*)?',
        file: '/path/to/nuxt-app/pages/dashboard.vue',
        meta: { i18n: false },
        children: [],
      },
      { name: 'about', path: '/about', file: '/path/to/nuxt-app/pages/about.vue', children: [] },
    ]
    const options = getNuxtOptions({})

    const localized = localize(pages, options)
    expect(localized.filter(x => String(x.name).startsWith('cms-dashboard'))).toEqual([pages[0]])
    expect(localized.find(x => x.name === 'about___fr')).toBeTruthy()
  })

  test('meta `i18n: false` disables localization in `page` mode (#3951)', () => {
    const pages: NuxtPage[] = [
      {
        name: 'cms-dashboard',
        path: '/dashboard/:catchAll(.*)?',
        file: '/path/to/nuxt-app/pages/dashboard.vue',
        meta: { i18n: false },
        children: [],
      },
    ]
    const options = getNuxtOptions({}, 'page')

    const localized = localize(pages, options)
    expect(localized).toEqual([pages[0]])
  })
})
