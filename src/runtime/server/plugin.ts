import { stringify } from 'devalue'
import { defineI18nMiddleware } from '@intlify/h3'
import { defineNitroPlugin, useRuntimeConfig, useStorage } from 'nitropack/runtime'
import { tryUseI18nContext, createI18nContext } from './context'
import { createUserLocaleDetector } from './utils/locale-detector'
import { pickNested } from './utils/messages-utils'
import { createLocaleConfigs, getDefaultLocaleForDomain, isSupportedLocale } from '../shared/locales'
import { setupVueI18nOptions } from '../shared/vue-i18n'
import { joinURL, withoutTrailingSlash } from 'ufo'
// @ts-expect-error virtual file
import { appId } from '#internal/nuxt.config.mjs'
import { localeDetector } from '#internal/i18n/locale.detector.mjs'
import { useI18nDetection, useRuntimeI18n } from '../shared/utils'

import { getRequestURL, sendRedirect, type H3Event } from 'h3'
import type { CoreOptions } from '@intlify/core'
import { useDetectors } from '../shared/detection'
import { domainFromLocale } from '../shared/domain'

const getHost = (event: H3Event) => getRequestURL(event, { xForwardedHost: true }).host

export function prefixable(currentLocale: string, defaultLocale: string): boolean {
  return (
    !__DIFFERENT_DOMAINS__ &&
    __I18N_ROUTING__ &&
    // only prefix default locale with strategy prefix
    (currentLocale !== defaultLocale || __I18N_STRATEGY__ === 'prefix')
  )
}

export default defineNitroPlugin(async nitro => {
  const runtimeConfig = useRuntimeConfig()

  const runtimeI18n = useRuntimeI18n()
  const defaultLocale: string = runtimeI18n.defaultLocale || ''

  // clear cache for i18n handlers on startup
  const cacheStorage = useStorage('cache')
  const cachedKeys = await cacheStorage.getKeys('nitro:handlers:i18n')
  await Promise.all(cachedKeys.map(key => cacheStorage.removeItem(key)))

  const detectConfig = useI18nDetection()
  function* detect(detectors: ReturnType<typeof useDetectors>, path: string) {
    // && !skipDetect(detectConfig, path, detectors.route(path))
    if (detectConfig.enabled) {
      yield detectors.cookie()
      yield detectors.header()
      // yield detectConfig.fallbackLocale
    }

    if (__DIFFERENT_DOMAINS__ || __MULTI_DOMAIN_LOCALES__) {
      yield detectors.host(path)
    }

    if (__I18N_ROUTING__) {
      yield detectors.route(path)
    }
  }
  const getDomainFromLocale = (event: H3Event, locale: string) => {
    return domainFromLocale(runtimeI18n.domainLocales, getRequestURL(event, { xForwardedHost: true }), locale)
  }
  // const rootRedirect = resolveRootRedirect(runtimeI18n.rootRedirect)

  // const createBaseUrlGetter = () => {
  //   const baseUrl = runtimeI18n.baseUrl
  //   if (isFunction(baseUrl)) {
  //     import.meta.dev &&
  //       console.warn('[nuxt-i18n] Configuring baseUrl as a function is deprecated and will be removed in v11.')
  //     return (): string => baseUrl(undefined)
  //   }

  //   return (event: H3Event): string => {
  //     if (__DIFFERENT_DOMAINS__ && defaultLocale) {
  //       return (getDomainFromLocale(event, defaultLocale) || baseUrl) ?? ''
  //     }

  //     return baseUrl ?? ''
  //   }
  // }
  // const baseUrlGetter = createBaseUrlGetter()

  nitro.hooks.hook('request', async (event: H3Event) => {
    const options = await setupVueI18nOptions(getDefaultLocaleForDomain(getHost(event)) || defaultLocale)
    const localeConfigs = createLocaleConfigs(options.fallbackLocale)
    const detector = useDetectors(event, detectConfig)

    event.context.nuxtI18n = createI18nContext()

    // detectConfig.redirectOn === 'all'
    let resolved = ''
    for (const detected of detect(detector, event.path)) {
      if (detected && isSupportedLocale(detected)) {
        resolved = detected
        break
      }
    }

    if (resolved) {
      let destination = ''
      const domainForLocale = getDomainFromLocale(event, resolved)
      if (__MULTI_DOMAIN_LOCALES__ && domainForLocale) {
        const fullBase = joinURL(domainForLocale, runtimeConfig.app.baseURL)
        const defaultLocale = getDefaultLocaleForDomain(getHost(event))
        if (__I18N_STRATEGY__ === 'prefix_except_default') {
          destination = joinURL(fullBase, defaultLocale === resolved ? '/' : `/${resolved}`)
        }

        destination ||= joinURL(fullBase, `/${resolved}`)

        let entryPath = event.path
        if (detector.route(entryPath) === resolved) {
          entryPath = entryPath.slice(resolved.length + 1)
        }
        destination = joinURL(destination, entryPath)
        if (destination !== withoutTrailingSlash(getRequestURL(event, { xForwardedHost: true }).href)) {
          return await sendRedirect(event, destination)
        }
      } else if (detectConfig.enabled && __I18N_ROUTING__ && detectConfig.redirectOn === 'root' && event.path === '/') {
        destination = prefixable(resolved, runtimeI18n.defaultLocale) ? `/${resolved}` : '/'
        if (destination !== event.path) {
          return await sendRedirect(event, destination)
        }
      }
    }

    event.context.nuxtI18n.vueI18nOptions = options
    event.context.nuxtI18n.localeConfigs = localeConfigs
  })

  nitro.hooks.hook('render:html', (htmlContext, { event }) => {
    const ctx = tryUseI18nContext(event)
    if (__I18N_PRELOAD__) {
      if (ctx == null || Object.keys(ctx.messages ?? {}).length == 0) return

      // only include the messages used in the current page
      if (__I18N_STRIP_UNUSED__ && !__IS_SSG__) {
        const trackedLocales = Object.keys(ctx.trackMap)
        for (const locale of Object.keys(ctx.messages)) {
          if (!trackedLocales.includes(locale)) {
            ctx.messages[locale] = {}
            continue
          }

          const usedKeys = Array.from(ctx.trackMap[locale])
          ctx.messages[locale] = pickNested(usedKeys, ctx.messages[locale]) as unknown as Record<string, string>
        }
      }

      try {
        htmlContext.bodyAppend.unshift(
          `<script type="application/json" data-nuxt-i18n="${appId}">${stringify(ctx.messages)}</script>`
        )
      } catch (_) {
        console.log(_)
      }
    }

    if (__I18N_STRICT_SEO__) {
      const raw = JSON.stringify(ctx?.slp ?? {})
      const safe = raw
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')
      htmlContext.head.push(`<script type="application/json" data-nuxt-i18n-slp="${appId}">${safe}</script>`)
    }
  })

  // enable server-side translations and user locale-detector
  if (localeDetector != null) {
    const options = await setupVueI18nOptions(defaultLocale)
    const i18nMiddleware = defineI18nMiddleware({
      ...(options as CoreOptions),
      locale: createUserLocaleDetector(options.locale, options.fallbackLocale)
    })

    nitro.hooks.hook('request', i18nMiddleware.onRequest)
    nitro.hooks.hook('afterResponse', i18nMiddleware.onAfterResponse)
  }
})
