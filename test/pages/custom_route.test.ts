import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import { localizeRoutes } from '../../src/routing'
import { getRouteOptionsResolver, analyzeNuxtPages } from '../../src/pages'
import { createPageAnalyzeContext, getNuxtOptions, stripFilePropertyFromPages } from './utils'
import { vi, afterAll, describe, test, expect } from 'vitest'

import type { NuxtI18nOptions } from '../../src/types'
import { deepCopy } from '@intlify/shared'
import { loadNuxt, buildNuxt } from '@nuxt/kit'
import { NuxtPage } from 'nuxt/schema'

/**
 * NOTE:
 *  This teardown is to avoid the weird issue of vitest.
 *  https://github.com/vitest-dev/vitest/issues/2845#issuecomment-1424666525
 */
afterAll(() => {
  vi.restoreAllMocks()
})

describe.each([
  {
    case: 'simple',
    options: getNuxtOptions({
      about: {
        en: '/about-us',
        fr: '/a-propos',
        es: '/sobre'
      }
    }),
    pages: [
      {
        path: '/about',
        file: '/path/to/nuxt-app/pages/about.vue',
        children: []
      }
    ]
  },
  {
    case: 'the part of URL',
    options: getNuxtOptions({
      about: {
        fr: '/a-propos'
      },
      'services/index': {
        fr: '/offres'
      },
      'services/development/index': {
        fr: '/offres/developement'
      },
      'services/development/app': {
        fr: '/offres/developement/app'
      },
      'services/development/website': {
        fr: '/offres/developement/site-web'
      },
      'services/coaching': {
        fr: '/offres/formation'
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
  },
  {
    case: 'dynamic parameters',
    options: getNuxtOptions({
      'blog/[date]/[slug]': {
        ja: '/blog/tech/[date]/[slug]'
      }
    }),
    pages: [
      {
        name: 'blog-date-slug',
        path: '/blog/:date/:slug',
        file: '/path/to/nuxt-app/pages/blog/[date]/[slug].vue',
        children: []
      }
    ]
  }
])('Module configuration', ({ case: _case, options, pages }) => {
  test(_case, () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue('')

    const ctx = createPageAnalyzeContext(undefined, undefined, options.pages)
    analyzeNuxtPages(ctx, ctx.pagesDir, pages)
    const localizedPages = localizeRoutes(pages, {
      ...options,
      includeUnprefixedFallback: false,
      optionsResolver: getRouteOptionsResolver(ctx, options as Required<NuxtI18nOptions>)
    } as Parameters<typeof localizeRoutes>[1])

    expect(localizedPages).toMatchSnapshot()
  })
})

const inPageConfigs = [
  {
    case: 'simple',
    options: getNuxtOptions({}, 'page'),
    pages: [
      {
        path: '/about',
        file: resolve(__dirname, '../fixtures/custom_route/simple/pages/about.vue'),
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
        file: resolve(__dirname, '../fixtures/custom_route/dynamic/pages/articles/[name].vue'),
        children: []
      }
    ]
  },
  {
    case: 'with definePageMeta',
    options: getNuxtOptions({}, 'page'),
    pages: [
      {
        path: '/about',
        file: resolve(__dirname, '../fixtures/custom_route/with_meta/pages/about.vue'),
        children: []
      }
    ]
  },
  {
    case: 'JavaScript',
    options: getNuxtOptions({}, 'page'),
    pages: [
      {
        path: '/about',
        file: resolve(__dirname, '../fixtures/custom_route/js/pages/about.vue'),
        children: []
      }
    ]
  },
  {
    case: 'ignore custom route',
    options: getNuxtOptions({}, 'page'),
    pages: [
      {
        path: '/about',
        file: resolve(__dirname, '../fixtures/ignore_route/disable/pages/about.vue'),
        children: []
      }
    ]
  }
]

describe('Extract page meta', () => {
  test.each(inPageConfigs)(`$case (meta)`, async ({ case: _case, options, pages }) => {
    const copy = {} as typeof options
    deepCopy(options, copy)
    copy.customRoutes = 'meta'

    let pagesResolved: (value: NuxtPage[] | PromiseLike<NuxtPage[]>) => void
    const localizedPages = new Promise<NuxtPage[]>(res => (pagesResolved = res))

    const nuxt = await loadNuxt({
      rootDir: resolve(process.cwd(), './test/fixtures/kit'),
      configFile: 'nuxt.config',
      dev: false,

      overrides: {
        css: [],
        dev: false,
        watch: [],
        modules: ['@nuxtjs/i18n'],
        dir: { pages: dirname(pages[0].file) },
        i18n: copy,
        hooks: {
          'pages:resolved': pages => {
            pagesResolved(pages)
            // close early, we have what we need
            nuxt.close()
          }
        }
      }
    })

    try {
      await buildNuxt(nuxt)
    } catch (_) {
      // ignore build errors
    }
    expect(stripFilePropertyFromPages(await localizedPages)).toMatchSnapshot()
  })
})

describe('Page components', () => {
  test.each(inPageConfigs)(`$case`, async ({ case: _case, options, pages }) => {
    const ctx = createPageAnalyzeContext(undefined, undefined, options.pages)
    analyzeNuxtPages(ctx, ctx.pagesDir, pages)
    const localizedPages = localizeRoutes(pages, {
      ...options,
      includeUnprefixedFallback: false,
      optionsResolver: getRouteOptionsResolver(ctx, options as Required<NuxtI18nOptions>)
    } as Parameters<typeof localizeRoutes>[1])
    expect(stripFilePropertyFromPages(localizedPages)).toMatchSnapshot()
  })
})

test('#1649', () => {
  const pages = [
    {
      path: '/account',
      file: '/path/to/1649/pages/account.vue',
      children: [
        {
          name: 'account-addresses',
          path: 'addresses',
          file: '/path/to/1649/pages/account/addresses.vue',
          children: []
        },
        {
          name: 'account',
          path: '',
          file: '/path/to/1649/pages/account/index.vue',
          children: []
        },
        {
          name: 'account-profile',
          path: 'profile',
          file: '/path/to/1649/pages/account/profile.vue',
          children: []
        }
      ]
    },
    {
      name: 'index',
      path: '/',
      file: '/path/to/1649/pages/index.vue',
      children: []
    }
  ]

  const options = getNuxtOptions({
    account: {
      fr: '/compte'
    },
    'account/profile': {
      fr: '/compte/profil'
    },
    'account/addresses': {
      fr: '/compte/adresses'
    }
  })

  vi.spyOn(fs, 'readFileSync').mockReturnValue('')

  const ctx = createPageAnalyzeContext('/path/to/1649', undefined, options.pages)
  analyzeNuxtPages(ctx, ctx.pagesDir, pages)
  const localizedPages = localizeRoutes(pages, {
    ...options,
    includeUnprefixedFallback: false,
    optionsResolver: getRouteOptionsResolver(ctx, options as Required<NuxtI18nOptions>)
  } as Parameters<typeof localizeRoutes>[1])

  expect(localizedPages).toMatchSnapshot()
})

test('pages config using route name', () => {
  const pages = [
    {
      path: '/account',
      file: '/path/to/1649/pages/account.vue',
      children: [
        {
          name: 'account-addresses',
          path: 'addresses',
          file: '/path/to/1649/pages/account/addresses.vue',
          children: []
        },
        {
          name: 'account',
          path: '',
          file: '/path/to/1649/pages/account/index.vue',
          children: []
        },
        {
          name: 'account-profile',
          path: 'profile',
          file: '/path/to/1649/pages/account/profile.vue',
          children: []
        }
      ]
    },
    {
      name: 'index',
      path: '/',
      file: '/path/to/1649/pages/index.vue',
      children: []
    }
  ]

  const options = getNuxtOptions({
    account: {
      fr: '/compte'
    },
    'account-profile': {
      fr: '/compte/profil'
    },
    'account-addresses': {
      fr: '/compte/adresses'
    }
  })

  vi.spyOn(fs, 'readFileSync').mockReturnValue('')

  const ctx = createPageAnalyzeContext('/path/to/1649', undefined, options.pages)
  analyzeNuxtPages(ctx, ctx.pagesDir, pages)
  const localizedPages = localizeRoutes(pages, {
    ...options,
    includeUnprefixedFallback: false,
    optionsResolver: getRouteOptionsResolver(ctx, options as Required<NuxtI18nOptions>)
  } as Parameters<typeof localizeRoutes>[1])
  expect(localizedPages).toMatchSnapshot()
})
