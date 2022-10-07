import fs from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { vi, describe, test, expect } from 'vitest'
import { localizeRoutes } from 'vue-i18n-routing'
import { getRouteOptionsResolver } from '../../src/pages'
import { getNuxtOptions, stripFilePropertyFromPages } from './utils'

import type { NuxtI18nOptions } from '../../src/types'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

describe.each([
  {
    case: 'simple',
    options: getNuxtOptions({ about: { ja: '/about-ja' } }),
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
      'nested/route': {
        en: '/mycustompath/nested/route'
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
      ':nested/:route': {
        en: '/mycustompath/:nested/:route'
      },
      ':nested/:route/:slug(.*)*': {
        en: '/mycustompath/:nested/:slug(.*)*'
      }
    }),
    pages: [
      {
        name: 'nested-route-slug',
        path: '/:nested/:route/:slug(.*)*',
        file: '/path/to/nuxt-app/pages/[nested]/[route]/[...slug].vue',
        children: []
      },
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
        fr: '/a-propos'
      },
      services: {
        fr: '/offres'
      },
      'services/development': {
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
        name: 'about',
        path: '/about',
        file: '/path/to/nuxt-app/pages/about/index.vue',
        children: []
      },
      {
        name: 'services-development-app',
        path: '/services/development/app',
        file: '/path/to/nuxt-app/pages/services/development/app/index.vue',
        children: []
      },
      {
        name: 'services-development-coaching',
        path: '/services/development/coaching',
        file: '/path/to/nuxt-app/pages/services/development/coaching/index.vue',
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
        file: '/path/to/nuxt-app/pages/services/development/website/index.vue',
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
])('configuration', ({ case: _case, options, pages }) => {
  test(_case, async () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue('')

    const localizedPages = localizeRoutes(pages, {
      ...options,
      includeUprefixedFallback: false,
      optionsResolver: getRouteOptionsResolver('pages', options as Required<NuxtI18nOptions>)
    })
    expect(localizedPages).toMatchSnapshot()
  })
})

describe.each([
  {
    case: 'simple',
    options: getNuxtOptions({}, true),
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
    options: getNuxtOptions({}, true),
    pages: [
      {
        name: 'articles-name',
        path: '/articles/:name',
        file: resolve(__dirname, '../fixtures/custom_route/dynamic/pages/articles/[name].vue'),
        children: []
      }
    ]
  }
])('component', ({ case: _case, options, pages }) => {
  test(_case, async () => {
    const localizedPages = localizeRoutes(pages, {
      ...options,
      includeUprefixedFallback: false,
      optionsResolver: getRouteOptionsResolver('pages', options as Required<NuxtI18nOptions>)
    })
    expect(stripFilePropertyFromPages(localizedPages)).toMatchSnapshot()
  })
})
