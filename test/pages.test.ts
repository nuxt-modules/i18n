import { vi, describe, test, expect } from 'vitest'
import { localizeRoutes } from 'vue-i18n-routing'
import { getRouteOptionsResolver } from '../src/pages'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

import type { NuxtI18nOptions } from '../src/types'
import { I18nRoute } from 'vue-i18n-routing'
import type { NuxtHooks } from '@nuxt/schema'

type ExtractArrayType<T> = T extends (infer U)[] ? U : never
type NuxtPage = ExtractArrayType<Parameters<NuxtHooks['pages:extend']>[0]>

const __dirname = fileURLToPath(new URL('.', import.meta.url))

function getNuxtOptions(pages: Required<NuxtI18nOptions>['pages'], parsePages = false): NuxtI18nOptions {
  return {
    parsePages,
    pages,
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    defaultLocaleRouteNameSuffix: 'default',
    trailingSlash: false,
    routesNameSeparator: '___',
    locales: [
      { code: 'en', iso: 'en-US', file: 'en.json', name: 'English' },
      { code: 'ja', iso: 'ja-JP', file: 'ja.json', name: 'Japanses' },
      { code: 'fr', iso: 'fr-FR', file: 'fr.json', name: 'Français' }
    ]
  }
}

function stripFilePropertyFromPages(routes: I18nRoute[]) {
  return routes.map(route => {
    delete route.file
    if (route.children) {
      route.children = stripFilePropertyFromPages(route.children)
    }
    return route
  })
}

test('basic', async () => {
  vi.spyOn(fs, 'readFileSync').mockReturnValue('')

  const options = getNuxtOptions({})
  const pages: NuxtPage[] = [
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
  const localizedPages = localizeRoutes(pages, {
    ...options,
    includeUprefixedFallback: false,
    optionsResolver: getRouteOptionsResolver('pages', options as Required<NuxtI18nOptions>)
  })
  expect(localizedPages).toMatchSnapshot()
})

describe('custom route', () => {
  describe('configuration', () => {
    test('simple', async () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValue('')

      const options = getNuxtOptions({ about: { ja: '/about-ja' } })
      const pages: NuxtPage[] = [
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
      const localizedPages = localizeRoutes(pages, {
        ...options,
        includeUprefixedFallback: false,
        optionsResolver: getRouteOptionsResolver('pages', options as Required<NuxtI18nOptions>)
      })
      expect(localizedPages).toMatchSnapshot()
    })

    test('nested static route', async () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValue('')

      const options = getNuxtOptions({
        'nested/route': {
          en: '/mycustompath/nested/route'
        }
      })
      const pages: NuxtPage[] = [
        {
          name: 'nested-route',
          path: '/nested/route',
          file: '/path/to/nuxt-app/pages/nested/route/index.vue',
          children: []
        }
      ]
      const localizedPages = localizeRoutes(pages, {
        ...options,
        includeUprefixedFallback: false,
        optionsResolver: getRouteOptionsResolver('pages', options as Required<NuxtI18nOptions>)
      })
      expect(localizedPages).toMatchSnapshot()
    })

    test('nested dynamic route', async () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValue('')

      const options = getNuxtOptions({
        ':nested/:route': {
          en: '/mycustompath/:nested/:route'
        },
        ':nested/:route/:slug(.*)*': {
          en: '/mycustompath/:nested/:slug(.*)*'
        }
      })
      const pages: NuxtPage[] = [
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
      const localizedPages = localizeRoutes(pages, {
        ...options,
        includeUprefixedFallback: false,
        optionsResolver: getRouteOptionsResolver('pages', options as Required<NuxtI18nOptions>)
      })
      expect(localizedPages).toMatchSnapshot()
    })

    test('nested complex route', async () => {
      const options = getNuxtOptions({
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
      })
      const pages: NuxtPage[] = [
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
      const localizedPages = localizeRoutes(pages, {
        ...options,
        includeUprefixedFallback: false,
        optionsResolver: getRouteOptionsResolver('pages', options as Required<NuxtI18nOptions>)
      })
      expect(localizedPages).toMatchSnapshot()
    })
  })

  describe('component', () => {
    test('simple', async () => {
      const options = getNuxtOptions({}, true)
      const pages: NuxtPage[] = [
        {
          path: '/about',
          file: resolve(__dirname, './fixtures/simple/pages/about.vue'),
          children: []
        }
      ]
      const localizedPages = localizeRoutes(pages, {
        ...options,
        includeUprefixedFallback: false,
        optionsResolver: getRouteOptionsResolver('pages', options as Required<NuxtI18nOptions>)
      })
      expect(stripFilePropertyFromPages(localizedPages)).toMatchSnapshot()
    })

    test('script-setup', async () => {
      const options = getNuxtOptions({}, true)
      const pages: NuxtPage[] = [
        {
          path: '/about',
          file: resolve(__dirname, './fixtures/script-setup/pages/about.vue'),
          children: []
        }
      ]
      const localizedPages = localizeRoutes(pages, {
        ...options,
        includeUprefixedFallback: false,
        optionsResolver: getRouteOptionsResolver('pages', options as Required<NuxtI18nOptions>)
      })
      expect(stripFilePropertyFromPages(localizedPages)).toMatchSnapshot()
    })

    test('dynami route', async () => {
      const options = getNuxtOptions({}, true)
      const pages: NuxtPage[] = [
        {
          name: 'articles-name',
          path: '/articles/:name',
          file: resolve(__dirname, './fixtures/dynamic/pages/articles/[name].vue'),
          children: []
        }
      ]
      const localizedPages = localizeRoutes(pages, {
        ...options,
        includeUprefixedFallback: false,
        optionsResolver: getRouteOptionsResolver('pages', options as Required<NuxtI18nOptions>)
      })
      expect(stripFilePropertyFromPages(localizedPages)).toMatchSnapshot()
    })
  })
})
