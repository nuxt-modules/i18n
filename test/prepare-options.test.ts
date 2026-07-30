import { afterEach, describe, expect, it, vi } from 'vitest'
import { defu } from 'defu'
import { prepareOptions } from '../src/prepare/options'
import { DEFAULT_OPTIONS } from '../src/constants'
import { logger } from '../src/utils'

import type { Nuxt } from '@nuxt/schema'
import type { I18nNuxtContext } from '../src/context'
import type { NuxtI18nOptions } from '../src/types'

/** Mirrors how `createContext` builds its options - Nuxt merges the user config over the defaults */
function warningsFor(rawOptions: NuxtI18nOptions) {
  const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
  const ctx = {
    options: defu(rawOptions, DEFAULT_OPTIONS),
    rawOptions,
    i18nLayers: []
  } as unknown as I18nNuxtContext
  const nuxt = {
    options: {
      _layers: [{ config: { rootDir: '/project' }, configFile: 'nuxt.config.ts' }],
      experimental: { scanPageMeta: true },
      imports: { autoImport: true }
    }
  } as unknown as Nuxt

  prepareOptions(ctx, nuxt)
  return warn.mock.calls.map(([message]) => String(message))
}

const DOMAIN_OPTIONS = ['differentDomains', 'multiDomainLocales'] as const

afterEach(() => {
  vi.restoreAllMocks()
})

describe.each(DOMAIN_OPTIONS)('`%s`', (option) => {
  const domainLocales = [{ code: 'en', domain: 'en.example.com' }, { code: 'fr', domains: ['fr.example.com'] }]

  it('does not need `defaultLocale`, the unprefixed locale is resolved per host', () => {
    expect(warningsFor({ [option]: true, strategy: 'prefix_except_default', locales: domainLocales }))
      .toEqual([])
  })

  it('warns when no locale carries a domain', () => {
    expect(warningsFor({ [option]: true, defaultLocale: 'en', locales: ['en', 'fr'] }))
      .toEqual([`Locale \`domains\` must be configured to use \`${option}\`.`])
  })

  it('reports `compactRoutes` as having no effect', () => {
    const warnings = warningsFor({
      [option]: true,
      defaultLocale: 'en',
      locales: domainLocales,
      experimental: { compactRoutes: true }
    })

    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain(`incompatible option(s): \`${option}\``)
  })
})

it('names both domain options when both are set', () => {
  expect(warningsFor({ differentDomains: true, multiDomainLocales: true, defaultLocale: 'en', locales: ['en'] }))
    .toEqual(['Locale `domains` must be configured to use `differentDomains` and `multiDomainLocales`.'])
})

it('warns about a missing `defaultLocale` without domain routing', () => {
  expect(warningsFor({ strategy: 'prefix_and_default', locales: ['en', 'fr'] }))
    .toEqual(['The `prefix_and_default` i18n strategy needs `defaultLocale` to be set.'])
})
