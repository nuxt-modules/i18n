import { vi, test, expect } from 'vitest'
import { localizeRoutes } from 'vue-i18n-routing'
import { getRouteOptionsResolver } from '../../src/pages'
import fs from 'node:fs'
import { getNuxtOptions } from './utils'

import type { NuxtI18nOptions } from '../../src/types'
import type { NuxtPage } from './utils'

test('localized', async () => {
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
