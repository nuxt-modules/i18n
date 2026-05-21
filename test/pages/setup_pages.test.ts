import { describe, expect, it, vi, beforeEach } from 'vitest'
import { setupPages } from '../../src/pages'
import { getNormalizedLocales } from './utils'

import type { Nuxt, NuxtPage } from '@nuxt/schema'
import type { I18nNuxtContext } from '../../src/context'
import type { NuxtI18nOptions } from '../../src/types'

type NuxtHookCallback = (...args: unknown[]) => unknown | Promise<unknown>

const kitMocks = vi.hoisted(() => {
  const templates: Array<{ filename?: string, getContents?: () => string }> = []
  return {
    templates,
    addTemplate: vi.fn((template: { filename?: string, getContents?: () => string }) => {
      templates.push(template)
      return template
    }),
    updateTemplates: vi.fn(),
  }
})

vi.mock('@nuxt/kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nuxt/kit')>()
  return {
    ...actual,
    addTemplate: kitMocks.addTemplate,
    updateTemplates: kitMocks.updateTemplates,
  }
})

function createNuxt() {
  const hooks = new Map<string, NuxtHookCallback>()
  const nuxt = {
    options: {
      ssr: false,
      nitro: { static: false },
      experimental: {
        typedPages: false,
        extraPageMetaExtractionKeys: [],
      },
      _layers: [
        {
          config: {
            rootDir: '/project',
            srcDir: '',
            dir: { pages: 'pages' },
          },
        },
      ],
    },
    hook: vi.fn((name: string, callback: NuxtHookCallback) => {
      hooks.set(name, callback)
    }),
    apps: { default: { pages: [] } },
  } as unknown as Nuxt

  return { nuxt, hooks }
}

function createI18nContext(strategy: NuxtI18nOptions['strategy']): I18nNuxtContext {
  const normalizedLocales = getNormalizedLocales(['en', 'fr'])
  return {
    localeCodes: ['en', 'fr'],
    normalizedLocales,
    options: {
      customRoutes: 'config',
      defaultLocale: 'en',
      defaultLocaleRouteNameSuffix: 'default',
      experimental: {},
      locales: normalizedLocales,
      pages: {},
      routesNameSeparator: '___',
      strategy,
      trailingSlash: false,
    },
  } as I18nNuxtContext
}

describe('setupPages', () => {
  beforeEach(() => {
    kitMocks.templates.length = 0
    kitMocks.addTemplate.mockClear()
    kitMocks.updateTemplates.mockClear()
  })

  it('does not emit pathToI18nConfig entries when no_prefix does not localize routes', async () => {
    const { nuxt, hooks } = createNuxt()
    await setupPages(createI18nContext('no_prefix'), nuxt)

    const pages: NuxtPage[] = [
      { path: '/', name: 'index', file: '/project/pages/index.vue' },
      { path: '/about', name: 'about', file: '/project/pages/about.vue' },
    ]
    await hooks.get('pages:extend')?.(pages)

    const resourcesTemplate = kitMocks.templates.find(template => template.filename === 'i18n-route-resources.mjs')
    expect(resourcesTemplate?.getContents?.()).toContain('export const pathToI18nConfig = {};')
  })
})
