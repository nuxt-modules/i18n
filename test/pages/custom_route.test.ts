import { vi, test, expect } from 'vitest'
import fs from 'node:fs'
import { resolve } from 'node:path'
import { localizeRoutes } from 'vue-i18n-routing'
import { getRouteOptionsResolver, analyzeNuxtPages } from '../../src/pages'
import { getNuxtOptions, stripFilePropertyFromPages } from './utils'

import { NuxtPageAnalizeContext, AnalizedNuxtPageMeta } from '../../src/pages'
import type { NuxtI18nOptions } from '../../src/types'
import type { NuxtPage } from './utils'

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
])('Modeule configration', ({ case: _case, options, pages }) => {
  test(_case, async () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue('')

    const srcDir = '/path/to/nuxt-app'
    const pagesDir = 'pages'
    const ctx: NuxtPageAnalizeContext = {
      stack: [],
      srcDir,
      pagesDir,
      pages: new Map<NuxtPage, AnalizedNuxtPageMeta>()
    }

    analyzeNuxtPages(ctx, pages)
    const localizedPages = localizeRoutes(pages, {
      ...options,
      includeUprefixedFallback: false,
      optionsResolver: getRouteOptionsResolver(ctx, options as Required<NuxtI18nOptions>)
    })

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
  }
])('Page components', ({ case: _case, options, pages }) => {
  test(_case, async () => {
    const srcDir = '/path/to/nuxt-app'
    const pagesDir = 'pages'
    const ctx: NuxtPageAnalizeContext = {
      stack: [],
      srcDir,
      pagesDir,
      pages: new Map<NuxtPage, AnalizedNuxtPageMeta>()
    }

    analyzeNuxtPages(ctx, pages)
    const localizedPages = localizeRoutes(pages, {
      ...options,
      includeUprefixedFallback: false,
      optionsResolver: getRouteOptionsResolver(ctx, options as Required<NuxtI18nOptions>)
    })
    expect(stripFilePropertyFromPages(localizedPages)).toMatchSnapshot()
  })
})

test('#1649', async () => {
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

  const srcDir = '/path/to/1649'
  const pagesDir = 'pages'
  const ctx: NuxtPageAnalizeContext = {
    stack: [],
    srcDir,
    pagesDir,
    pages: new Map<NuxtPage, AnalizedNuxtPageMeta>()
  }

  analyzeNuxtPages(ctx, pages)
  const localizedPages = localizeRoutes(pages, {
    ...options,
    includeUprefixedFallback: false,
    optionsResolver: getRouteOptionsResolver(ctx, options as Required<NuxtI18nOptions>)
  })

  expect(localizedPages).toMatchSnapshot()
})
