import { useNuxtApp, useRequestURL } from '#imports'
import { resolveDefaultLocale } from './shared/locales'
import { getDomainLocales } from './shared/domain'
import { useRuntimeI18n } from './shared/utils'
import { resolveDomainRoutes } from './routing/domain'

import type { RouterConfig } from 'nuxt/schema'

export default {
  routes: (routes) => {
    const runtimeI18n = useRuntimeI18n(useNuxtApp())
    const defaultLocale = resolveDefaultLocale(
      useRequestURL({ xForwardedHost: true }).host,
      runtimeI18n.defaultLocale,
      getDomainLocales(runtimeI18n.domainLocales),
    )
    return resolveDomainRoutes(routes, defaultLocale, __I18N_STRATEGY__)
  },
} satisfies RouterConfig
