import fs from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { vi, describe, test, expect } from 'vitest'
import { localizeRoutes } from 'vue-i18n-routing'
import { getRouteOptionsResolver } from '../../../src/pages'
import { getNuxtOptions, stripFilePropertyFromPages } from '../utils'

import type { NuxtI18nOptions } from '../../../src/types'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

describe.each([
  {
    case: 'simple',
    options: getNuxtOptions({ about: false }),
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
      'nested/route': false
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
      ':nested/:route': false,
      ':nested/:route/:slug(.*)*': false
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
      about: false,
      services: false,
      'services/development': false,
      'services/development/app': false,
      'services/development/website': false,
      'services/coaching': false
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
    case: 'basic',
    options: getNuxtOptions({}, true),
    pages: [
      {
        path: '/about',
        file: resolve(__dirname, '../../fixtures/ignore_route/disable/pages/about.vue'),
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
