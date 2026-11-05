import { useNuxtApp, useRequestURL } from '#imports'
import { resolveDefaultLocale } from './shared/locales'
import { useRuntimeI18n } from './shared/utils'
import { resolveDomainRoutes } from './routing/domain'

import type { RouterConfig } from 'nuxt/schema'

export default {
  routes: (routes) => {
    const defaultLocale = resolveDefaultLocale(
      useRequestURL({ xForwardedHost: true }).host,
      useRuntimeI18n(useNuxtApp()).defaultLocale,
    )
    return resolveDomainRoutes(routes, defaultLocale, __I18N_STRATEGY__)
  },
} satisfies RouterConfig
