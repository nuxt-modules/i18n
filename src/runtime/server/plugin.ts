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
import { isFunction } from '@intlify/shared'

import { getRequestURL, sendRedirect, type H3Event, setCookie, sendNoContent } from 'h3'
import type { CoreOptions } from '@intlify/core'
import { useDetectors } from '../shared/detection'
import { domainFromLocale } from '../shared/domain'
import { matchLocalized } from '../shared/matching'

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
      yield { locale: detectors.cookie(), source: 'cookie' }
      yield { locale: detectors.header(), source: 'header' }
      // yield detectConfig.fallbackLocale
    }

    if (__DIFFERENT_DOMAINS__ || __MULTI_DOMAIN_LOCALES__) {
      yield { locale: detectors.host(path), source: 'domain' }
    }

    if (__I18N_ROUTING__) {
      yield { locale: detectors.route(path), source: 'route' }
    }
  }
  const getDomainFromLocale = (event: H3Event, locale: string) => {
    if (!__MULTI_DOMAIN_LOCALES__ && !__DIFFERENT_DOMAINS__) return
    return domainFromLocale(runtimeI18n.domainLocales, getRequestURL(event, { xForwardedHost: true }), locale)
  }

  const createBaseUrlGetter = () => {
    const baseUrl = runtimeI18n.baseUrl
    if (isFunction(baseUrl)) {
      import.meta.dev &&
        console.warn('[nuxt-i18n] Configuring baseUrl as a function is deprecated and will be removed in v11.')
      return (): string => baseUrl(undefined)
    }

    return (event: H3Event, defaultLocale: string): string => {
      if (__MULTI_DOMAIN_LOCALES__ && defaultLocale) {
        const domainForLocale = getDomainFromLocale(event, defaultLocale) || baseUrl
        return domainForLocale ?? ''
      }
      if (__DIFFERENT_DOMAINS__ && defaultLocale) {
        return (getDomainFromLocale(event, defaultLocale) || baseUrl) ?? ''
      }

      // if baseUrl is not determined by domain then prefer relative URL from server-side
      return ''
      // return baseUrl ?? ''
    }
  }
  const baseUrlGetter = createBaseUrlGetter()

  nitro.hooks.hook('request', async (event: H3Event) => {
    if (event.path === '/.well-known/appspecific/com.chrome.devtools.json' || event.path === '/favicon.ico') {
      sendNoContent(event)
      return
    }
    const options = await setupVueI18nOptions(getDefaultLocaleForDomain(getHost(event)) || defaultLocale)
    const localeConfigs = createLocaleConfigs(options.fallbackLocale)
    const detector = useDetectors(event, detectConfig)

    event.context.nuxtI18n = createI18nContext()

    let locale = ''
    for (const detected of detect(detector, event.path)) {
      if (detected.locale && isSupportedLocale(detected.locale)) {
        locale = detected.locale
        break
      }
    }

    const pathLocale = detector.route(event.path)
    const skipRedirectOnPrefix = detectConfig.redirectOn === 'no prefix' && pathLocale && isSupportedLocale(pathLocale)
    const skipRedirectOnRoot = detectConfig.redirectOn === 'root' && event.path !== '/'

    if (locale && !skipRedirectOnPrefix && !skipRedirectOnRoot) {
      event.context.nuxtI18n.detectRoute = event.path

      const domainForLocale = getDomainFromLocale(event, locale)
      const defaultLocale =
        (__MULTI_DOMAIN_LOCALES__ && domainForLocale && getDefaultLocaleForDomain(getHost(event))) ||
        runtimeI18n.defaultLocale
      const localeInPath = detector.route(event.path)
      const entry = isSupportedLocale(localeInPath) ? event.path.slice(localeInPath!.length + 1) : event.path
      const resolvedLocalized = matchLocalized(entry || '/', locale, defaultLocale)
      if (resolvedLocalized && resolvedLocalized !== event.path) {
        setCookie(event, 'i18n_redirected', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
        const fullDestination = withoutTrailingSlash(joinURL(baseUrlGetter(event, defaultLocale), resolvedLocalized))
        await sendRedirect(event, fullDestination, 302)
        return
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
