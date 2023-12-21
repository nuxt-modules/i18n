import fs from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { vi, describe, test, expect } from 'vitest'
import { localizeRoutes } from '../../../src/routing'
import { getRouteOptionsResolver, analyzeNuxtPages } from '../../../src/pages'
import { getNuxtOptions, stripFilePropertyFromPages } from '../utils'

import type { NuxtPage } from '@nuxt/schema'
import type { NuxtI18nOptions } from '../../../src/types'
import type { NuxtPageAnalyzeContext, AnalyzedNuxtPageMeta } from '../../../src/pages'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

describe.each([
  {
    case: 'simple',
    options: getNuxtOptions({ about: { ja: false } }),
    pages: [
      {
        path: '/about',
        file: '/path/to/nuxt-app/pages/about.vue',
        children: [
          {
            name: 'about',
            path: '',
            file: '/path/to/nuxt-app/pages/about/index.vue',
            children: []
          }
        ]
      },
      {
        name: 'index',
        path: '/',
        file: '/path/to/nuxt-app/pages/index.vue',
        children: []
      }
    ]
  },
  {
    case: 'nested static route',
    options: getNuxtOptions({
      'nested/route/index': {
        en: false
      }
    }),
    pages: [
      {
        name: 'nested-route',
        path: '/nested/route',
        file: '/path/to/nuxt-app/pages/nested/route/index.vue',
        children: []
      }
    ]
  },
  {
    case: 'nested dynamic route',
    options: getNuxtOptions({
      '[nested]/[route]/index': {
        en: false
      }
    }),
    pages: [
      {
        name: 'nested-route',
        path: '/:nested/:route',
        file: '/path/to/nuxt-app/pages/[nested]/[route]/index.vue',
        children: []
      }
    ]
  },
  {
    case: 'nested complex route',
    options: getNuxtOptions({
      about: {
        fr: false
      },
      'services/index': {
        fr: false,
        ja: false
      },
      'services/development/index': {
        fr: false
      },
      'services/development/app': {
        fr: false,
        en: false
      },
      'services/development/website': {
        fr: false
      },
      'services/coaching': {
        fr: false
      }
    }),
    pages: [
      {
        path: '/about',
        file: '/path/to/nuxt-app/pages/about.vue',
        children: []
      },
      {
        name: 'services-coaching',
        path: '/services/coaching',
        file: '/path/to/nuxt-app/pages/services/coaching.vue',
        children: []
      },
      {
        name: 'services-development-app',
        path: '/services/development/app',
        file: '/path/to/nuxt-app/pages/services/development/app.vue',
        children: []
      },
      {
        name: 'services-development',
        path: '/services/development',
        file: '/path/to/nuxt-app/pages/services/development/index.vue',
        children: []
      },
      {
        name: 'services-development-website',
        path: '/services/development/website',
        file: '/path/to/nuxt-app/pages/services/development/website.vue',
        children: []
      },
      {
        name: 'services',
        path: '/services',
        file: '/path/to/nuxt-app/pages/services/index.vue',
        children: []
      }
    ]
  }
])('Module configuration', ({ case: _case, options, pages }) => {
  test(_case, async () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue('')

    const srcDir = '/path/to/nuxt-app'
    const pagesDir = 'pages'
    const ctx: NuxtPageAnalyzeContext = {
      stack: [],
      srcDir,
      pagesDir,
      pages: new Map<NuxtPage, AnalyzedNuxtPageMeta>()
    }

    analyzeNuxtPages(ctx, pages)

    const localizedPages = localizeRoutes(pages, {
      ...options,
      includeUnprefixedFallback: false,
      optionsResolver: getRouteOptionsResolver(ctx, options as Required<NuxtI18nOptions>)
    } as Parameters<typeof localizeRoutes>[1])
    expect(localizedPages).toMatchSnapshot()
  })
})

describe.each([
  {
    case: 'simple',
    options: getNuxtOptions({}, 'page'),
    pages: [
      {
        path: '/about',
        file: resolve(__dirname, '../../fixtures/ignore_route/pick/simple/pages/about.vue'),
        children: []
      }
    ]
  },
  {
    case: 'dynamic route',
    options: getNuxtOptions({}, 'page'),
    pages: [
      {
        name: 'articles-name',
        path: '/articles/:name',
        file: resolve(__dirname, '../../fixtures/ignore_route/pick/dynamic/pages/articles/[name].vue'),
        children: []
      }
    ]
  }
])('Page components', ({ case: _case, options, pages }) => {
  test(_case, async () => {
    const srcDir = '/path/to/nuxt-app'
    const pagesDir = 'pages'
    const ctx: NuxtPageAnalyzeContext = {
      stack: [],
      srcDir,
      pagesDir,
      pages: new Map<NuxtPage, AnalyzedNuxtPageMeta>()
    }

    analyzeNuxtPages(ctx, pages)

    const localizedPages = localizeRoutes(pages, {
      ...options,
      includeUnprefixedFallback: false,
      optionsResolver: getRouteOptionsResolver(ctx, options as Required<NuxtI18nOptions>)
    } as Parameters<typeof localizeRoutes>[1])
    expect(stripFilePropertyFromPages(localizedPages)).toMatchSnapshot()
  })
})
