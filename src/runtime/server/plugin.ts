import { stringify } from 'devalue'
import { defineI18nMiddleware } from '@intlify/h3'
import { defineNitroPlugin, useStorage } from 'nitropack/runtime'
import { tryUseI18nContext, createI18nContext } from './context'
import { createUserLocaleDetector } from './utils/locale-detector'
import { pickNested } from './utils/messages-utils'
import { createLocaleConfigs, getDefaultLocaleForDomain, isSupportedLocale } from '../shared/locales'
import { setupVueI18nOptions } from '../shared/vue-i18n'
import { joinURL, withoutTrailingSlash } from 'ufo'
// @ts-expect-error virtual file
import { appId } from '#internal/nuxt.config.mjs'
import { localeDetector } from '#internal/i18n/locale.detector.mjs'
import { resolveRootRedirect, useI18nDetection, useRuntimeI18n } from '../shared/utils'
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
  const runtimeI18n = useRuntimeI18n()
  const rootRedirect = resolveRootRedirect(runtimeI18n.rootRedirect)
  const _defaultLocale: string = runtimeI18n.defaultLocale || ''

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

  async function doRedirect(event: H3Event, to: string, code: number) {
    // console.log(`[nuxt-i18n] Redirecting to ${to} with code ${code}`)
    await sendRedirect(event, to, code)
  }

  function doSetCookie(event: H3Event, name: string, value: string, options?: Record<string, any>) {
    // console.log(`[nuxt-i18n] Setting cookie ${name} to ${value}`)
    setCookie(event, name, value, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', ...options })
  }

  nitro.hooks.hook('request', async (event: H3Event) => {
    if (event.path === '/.well-known/appspecific/com.chrome.devtools.json' || event.path === '/favicon.ico') {
      sendNoContent(event)
      return
    }
    const options = await setupVueI18nOptions(getDefaultLocaleForDomain(getHost(event)) || _defaultLocale)
    const localeConfigs = createLocaleConfigs(options.fallbackLocale)
    const detector = useDetectors(event, detectConfig)

    event.context.nuxtI18n = createI18nContext()

    let locale = ''
    if (detectConfig.enabled) {
      for (const detected of detect(detector, event.path)) {
        if (detected.locale && isSupportedLocale(detected.locale)) {
          // console.log(
          //   `[nuxt-i18n] Detected locale "${detected.locale}" from ${detected.source} for path "${event.path}"`
          // )
          locale = detected.locale
          break
        }
      }
    }

    const pathLocale = detector.route(event.path)
    const skipRedirectOnPrefix = detectConfig.redirectOn === 'no prefix' && pathLocale && isSupportedLocale(pathLocale)
    const skipRedirectOnRoot = detectConfig.redirectOn === 'root' && event.path !== '/'

    if (rootRedirect && event.path === '/') {
      const rootRedirectIsLocalized = isSupportedLocale(detector.route(rootRedirect.path))
      const resolvedPath = rootRedirectIsLocalized
        ? rootRedirect.path
        : matchLocalized(
            rootRedirect.path,
            (detectConfig.enabled && locale) || options.defaultLocale,
            options.defaultLocale
          )
      if (resolvedPath) {
        const _locale = detectConfig.enabled ? locale || options.defaultLocale : options.defaultLocale
        doSetCookie(event, 'i18n_redirected', _locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
        event.context.nuxtI18n.detectLocale = _locale
        await doRedirect(
          event,
          withoutTrailingSlash(joinURL(baseUrlGetter(event, options.defaultLocale), resolvedPath)),
          rootRedirect.code || 302
        )
        return
      }
    }

    // path locale exists and we skip redirect on prefix or root
    // ensure cookie is set to avoid redirecting from nuxt context
    if (skipRedirectOnPrefix && pathLocale && isSupportedLocale(pathLocale)) {
      doSetCookie(event, 'i18n_redirected', pathLocale)
      event.context.nuxtI18n.detectLocale = pathLocale
      locale = pathLocale
    } else if (locale && detectConfig.enabled && !skipRedirectOnPrefix && !skipRedirectOnRoot) {
      event.context.nuxtI18n.detectRoute = event.path

      const entry = isSupportedLocale(pathLocale) ? event.path.slice(pathLocale!.length + 1) : event.path
      const resolvedPath = matchLocalized(entry || '/', locale, options.defaultLocale)
      if (resolvedPath && resolvedPath !== event.path) {
        event.context.nuxtI18n.detectLocale = locale
        doSetCookie(event, 'i18n_redirected', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
        await doRedirect(
          event,
          withoutTrailingSlash(joinURL(baseUrlGetter(event, options.defaultLocale), resolvedPath)),
          302
        )
        return
      }
    }

    if (!pathLocale && __I18N_STRATEGY__ === 'prefix') {
      const resolvedPath = matchLocalized(event.path, options.defaultLocale, options.defaultLocale)
      if (resolvedPath && resolvedPath !== event.path) {
        await doRedirect(
          event,
          withoutTrailingSlash(joinURL(baseUrlGetter(event, options.defaultLocale), resolvedPath)),
          302
        )

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
    const options = await setupVueI18nOptions(_defaultLocale)
    const i18nMiddleware = defineI18nMiddleware({
      ...(options as CoreOptions),
      locale: createUserLocaleDetector(options.locale, options.fallbackLocale)
    })

    nitro.hooks.hook('request', i18nMiddleware.onRequest)
    nitro.hooks.hook('afterResponse', i18nMiddleware.onAfterResponse)
  }
})
