import { stringify } from 'devalue'
import { defineI18nMiddleware } from '@intlify/h3'
import { defineNitroPlugin, useStorage } from 'nitropack/runtime'
import { initializeI18nContext, tryUseI18nContext, useI18nContext } from './context'
import { createUserLocaleDetector } from './utils/locale-detector'
import { pickNested } from './utils/messages-utils'
import { isSupportedLocale } from '../shared/locales'
import { setupVueI18nOptions } from '../shared/vue-i18n'
import { joinURL } from 'ufo'
// @ts-expect-error virtual file
import { appId } from '#internal/nuxt.config.mjs'
import { localeDetector } from '#internal/i18n-locale-detector.mjs'
import { resolveRootRedirect, useI18nDetection, useRuntimeI18n } from '../shared/utils'
import { isFunction } from '@intlify/shared'

import { type H3Event, getRequestURL, sanitizeStatusCode, setCookie } from 'h3'
import type { CoreOptions } from '@intlify/core'
import { useDetectors } from '../shared/detection'
import { domainFromLocale } from '../shared/domain'
import { isExistingNuxtRoute, matchLocalized } from '../shared/matching'

function* detect(
  detectors: ReturnType<typeof useDetectors>,
  detection: ReturnType<typeof useI18nDetection>,
  path: string,
) {
  if (detection.enabled) {
    yield { locale: detectors.cookie(), source: 'cookie' }
    yield { locale: detectors.header(), source: 'header' }
  }

  if (__DIFFERENT_DOMAINS__ || __MULTI_DOMAIN_LOCALES__) {
    yield { locale: detectors.host(path), source: 'domain' }
  }

  if (__I18N_ROUTING__) {
    yield { locale: detectors.route(path), source: 'route' }
  }

  yield { locale: detection.fallbackLocale, source: 'fallback' }
}

// Adapted from H3 v1
// https://github.com/h3js/h3/blob/24231b9c448aa852b15b889c53253a783f67a126/src/utils/response.ts#L166-L179
function createRedirectResponse(event: H3Event, dest: string, code: number) {
  event.node.res.setHeader('location', dest)
  event.node.res.statusCode = sanitizeStatusCode(code, event.node.res.statusCode)

  return {
    headers: event.node.res.getHeaders() as Record<string, string>,
    statusCode: event.node.res.statusCode,
    body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${dest.replace(/"/g, '%22')}"></head></html>`,
  }
}

function serializeInlineScript(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function createStaticRootLocaleRedirectScript(
  runtimeI18n: ReturnType<typeof useRuntimeI18n>,
  detection: ReturnType<typeof useI18nDetection>,
  defaultLocale: string,
) {
  const locales = runtimeI18n.locales.map(locale => ({
    code: typeof locale === 'string' ? locale : locale.code,
    language: typeof locale === 'string' ? locale : (locale.language || locale.code),
  }))
  const config = {
    cookieKey: detection.cookieKey,
    defaultLocale,
    fallbackLocale: detection.fallbackLocale || '',
    strategy: __I18N_STRATEGY__,
    useCookie: detection.useCookie,
  }
  const serializedConfig = serializeInlineScript(config)
  const serializedLocales = serializeInlineScript(locales)

  return `
<script>
(() => {
  const config = ${serializedConfig}
  const locales = ${serializedLocales}
  const currentPath = window.location.pathname

  if (currentPath !== '/') {
    return
  }

  const normalize = value => String(value || '').toLowerCase()
  const getBaseLocale = value => normalize(value).split('-')[0]
  const matchesLocale = (tag, locale, exact) => {
    const normalizedTag = normalize(tag)
    const code = normalize(locale.code)
    const language = normalize(locale.language || locale.code)

    if (exact) {
      return normalizedTag === code || normalizedTag === language
    }

    return getBaseLocale(normalizedTag) === getBaseLocale(code) || getBaseLocale(normalizedTag) === getBaseLocale(language)
  }
  const findSupportedLocale = (tag, exact = true) => {
    if (!tag) {
      return ''
    }

    const locale = locales.find(locale => matchesLocale(tag, locale, exact))
    return locale?.code || ''
  }
  const detectFromNavigator = () => {
    const preferredLocales = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).filter(Boolean)

    for (const preferredLocale of preferredLocales) {
      const exactLocale = findSupportedLocale(preferredLocale)
      if (exactLocale) {
        return exactLocale
      }
    }

    for (const preferredLocale of preferredLocales) {
      const partialLocale = findSupportedLocale(preferredLocale, false)
      if (partialLocale) {
        return partialLocale
      }
    }

    return ''
  }
  const readCookie = key => {
    const parts = document.cookie ? document.cookie.split(/; */) : []

    for (const part of parts) {
      if (part.slice(0, key.length + 1) === key + '=') {
        return decodeURIComponent(part.slice(key.length + 1))
      }
    }

    return ''
  }
  const resolveRedirectPath = locale => {
    switch (config.strategy) {
      case 'prefix':
      case 'prefix_and_default':
        return '/' + locale
      case 'prefix_except_default':
        return locale === config.defaultLocale ? '/' : '/' + locale
      default:
        return ''
    }
  }

  let detectedLocale = ''

  if (config.useCookie) {
    detectedLocale = findSupportedLocale(readCookie(config.cookieKey))
  }

  if (!detectedLocale) {
    detectedLocale = detectFromNavigator()
      || findSupportedLocale(config.fallbackLocale)
      || findSupportedLocale(config.defaultLocale)
      || config.defaultLocale
  }

  const targetPath = detectedLocale ? resolveRedirectPath(detectedLocale) : ''
  if (targetPath && targetPath !== currentPath) {
    window.location.replace(targetPath + window.location.search + window.location.hash)
  }
})()
</script>`.trim()
}

export default defineNitroPlugin(async (nitro) => {
  const runtimeI18n = useRuntimeI18n()
  const rootRedirect = resolveRootRedirect(runtimeI18n.rootRedirect)
  const _defaultLocale: string = runtimeI18n.defaultLocale || ''

  // attempt to clear cache for i18n handlers on startup
  try {
    const cacheStorage = useStorage('cache')
    const cachedKeys = await cacheStorage.getKeys('nitro:handlers:i18n')
    await Promise.all(cachedKeys.map(key => cacheStorage.removeItem(key)))
  } catch {
    // no-op
  }

  const detection = useI18nDetection(undefined)
  const cookieOptions = {
    path: '/',
    domain: detection.cookieDomain || undefined,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax' as const,
    secure: detection.cookieSecure,
  }

  const getDomainFromLocale = (event: H3Event, locale: string) => {
    if (!__MULTI_DOMAIN_LOCALES__ && !__DIFFERENT_DOMAINS__) { return }
    return domainFromLocale(runtimeI18n.domainLocales, getRequestURL(event, { xForwardedHost: true }), locale)
  }

  const createBaseUrlGetter = () => {
    const baseUrl: string = isFunction(runtimeI18n.baseUrl) ? '' : runtimeI18n.baseUrl || ''
    if (isFunction(runtimeI18n.baseUrl)) {
      import.meta.dev
        && console.warn('[nuxt-i18n] Configuring baseUrl as a function is deprecated and will be removed in v11.')
      return (): string => ''
    }

    return (event: H3Event, defaultLocale: string): string => {
      if ((__MULTI_DOMAIN_LOCALES__ || __DIFFERENT_DOMAINS__) && defaultLocale) {
        return getDomainFromLocale(event, defaultLocale) || baseUrl
      }

      // if baseUrl is not determined by domain then prefer relative URL from server-side
      return ''
    }
  }

  function resolveRedirectPath(
    event: H3Event,
    path: string | undefined,
    pathLocale: string | undefined,
    defaultLocale: string,
    detector: ReturnType<typeof useDetectors>,
  ) {
    let locale = ''
    for (const detected of detect(detector, detection, event.path)) {
      if (detected.locale && isSupportedLocale(detected.locale)) {
        locale = detected.locale
        break
      }
    }
    locale ||= defaultLocale

    function getLocalizedMatch(locale: string) {
      const res = matchLocalized(path || '/', locale, defaultLocale)
      if (res && res !== event.path) {
        return res
      }
    }

    let resolvedPath = undefined
    let redirectCode = 302

    const requestURL = getRequestURL(event)
    if (rootRedirect && requestURL.pathname === '/') {
      locale = (detection.enabled && locale) || defaultLocale
      resolvedPath
        = (isSupportedLocale(detector.route(rootRedirect.path)) && rootRedirect.path)
          || matchLocalized(rootRedirect.path, locale, defaultLocale)
      redirectCode = rootRedirect.code
    } else if (runtimeI18n.redirectStatusCode) {
      redirectCode = runtimeI18n.redirectStatusCode
    }

    switch (detection.redirectOn) {
      case 'root':
        if (requestURL.pathname !== '/') { break }
      // fallthrough (root has no prefix)
      case 'no prefix':
        if (pathLocale) { break }
      // fallthrough to resolve
      case 'all':
        resolvedPath ??= getLocalizedMatch(locale)
        break
    }

    if (requestURL.pathname === '/' && __I18N_STRATEGY__ === 'prefix') {
      resolvedPath ??= getLocalizedMatch(defaultLocale)
    }
    return { path: resolvedPath, code: redirectCode, locale }
  }

  const baseUrlGetter = createBaseUrlGetter()

  nitro.hooks.hook('request', async (event: H3Event) => {
    await initializeI18nContext(event)
  })

  nitro.hooks.hook('render:before', async (context) => {
    if (!__I18N_SERVER_REDIRECT__) { return }
    const { event } = context

    const ctx = import.meta.prerender && !event.context.nuxtI18n ? await initializeI18nContext(event) : useI18nContext(event)
    const url = getRequestURL(event)
    const detector = useDetectors(event, detection)
    const localeSegment = detector.route(event.path)
    const pathLocale = (isSupportedLocale(localeSegment) && localeSegment) || undefined
    const path = (pathLocale && url.pathname.slice(pathLocale.length + 1)) ?? url.pathname

    // attempt to only run i18n detection for nuxt pages and i18n server routes
    if (!url.pathname.includes(__I18N_SERVER_ROUTE__) && !isExistingNuxtRoute(path)) {
      return
    }

    const resolved = resolveRedirectPath(event, path, pathLocale, ctx.vueI18nOptions!.defaultLocale, detector)
    if (resolved.path && resolved.path !== url.pathname) {
      ctx.detectLocale = resolved.locale
      detection.useCookie && setCookie(event, detection.cookieKey, resolved.locale, cookieOptions)
      context.response = createRedirectResponse(
        event,
        joinURL(baseUrlGetter(event, ctx.vueI18nOptions!.defaultLocale), resolved.path + url.search),
        resolved.code,
      )
      return
    }
  })

  nitro.hooks.hook('render:html', (htmlContext, { event }) => {
    const ctx = tryUseI18nContext(event)
    const requestURL = getRequestURL(event)
    const isStaticRootEntry = requestURL.pathname === '/'
      || (__I18N_STRATEGY__ === 'prefix' && requestURL.pathname === '/200.html')

    if (
      __IS_SSG__
      && detection.enabled
      && detection.redirectOn === 'root'
      && __I18N_STRATEGY__ !== 'no_prefix'
      && !__DIFFERENT_DOMAINS__
      && !__MULTI_DOMAIN_LOCALES__
      && !rootRedirect
      && isStaticRootEntry
    ) {
      // Static hosting has no request-time redirect. Bootstrap the locale redirect on the
      // prerendered root entry before Vue mounts so the initial paint matches the detected locale.
      // `strategy: 'prefix'` serves the root request from `200.html`, so include that shell too.
      htmlContext.head.unshift(
        createStaticRootLocaleRedirectScript(runtimeI18n, detection, ctx?.vueI18nOptions?.defaultLocale || _defaultLocale),
      )
    }

    if (__I18N_PRELOAD__) {
      if (ctx == null || Object.keys(ctx.messages ?? {}).length == 0) { return }

      // only include the messages used in the current page
      if (__I18N_STRIP_UNUSED__ && !__IS_SSG__) {
        const trackedLocales = Object.keys(ctx.trackMap)
        for (const locale of Object.keys(ctx.messages)) {
          if (!trackedLocales.includes(locale)) {
            ctx.messages[locale] = {}
            continue
          }

          const usedKeys = Array.from(ctx.trackMap[locale]!)
          ctx.messages[locale] = pickNested(usedKeys, ctx.messages[locale]!) as unknown as Record<string, string>
        }
      }

      try {
        htmlContext.bodyAppend.unshift(
          `<script type="application/json" data-nuxt-i18n="${appId}">${stringify(ctx.messages)}</script>`,
        )
      } catch (_) {
        console.warn(_)
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
      locale: createUserLocaleDetector(options.locale, options.fallbackLocale),
    })

    nitro.hooks.hook('request', i18nMiddleware.onRequest)
    nitro.hooks.hook('afterResponse', i18nMiddleware.onAfterResponse)
  }
})
