import { stringify } from 'devalue'
import { defineI18nMiddleware } from '@intlify/h3'
import { defineNitroPlugin, useRuntimeConfig, useStorage } from 'nitropack/runtime'
import { initializeI18nContext, tryUseI18nContext, useI18nContext } from './context'
import { createUserLocaleDetector } from './utils/locale-detector'
import { pickNested } from './utils/messages-utils'
import { isSupportedLocale, resolveDefaultLocale } from '../shared/locales'
import { setupVueI18nOptions } from '../shared/vue-i18n'
import { joinURL, parsePath } from 'ufo'
// @ts-expect-error virtual file
import { appId } from '#internal/nuxt.config.mjs'
import { localeDetector } from '#internal/i18n-locale-detector.mjs'
import { resolveRootRedirect, useI18nDetection, useRuntimeI18n } from '../shared/utils'
import { isFunction } from '@intlify/shared'

import { type H3Event, getRequestURL, sanitizeStatusCode, setCookie } from 'h3'
import type { CoreOptions } from '@intlify/core'
import { useDetectors } from '../shared/detection'
import { domainForHost, domainFromLocale, normalizeDomain } from '../shared/domain'
import { isExistingNuxtRoute, matchLocalized } from '../shared/matching'
import { createRedirectResolver } from './utils/redirect'

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
    if (!__I18N_DOMAINS__) { return }
    return domainFromLocale(runtimeI18n.domainLocales, getRequestURL(event, { xForwardedHost: true }), locale)
  }

  const createBaseUrlGetter = () => {
    const baseUrl: string = isFunction(runtimeI18n.baseUrl) ? '' : runtimeI18n.baseUrl || ''
    if (isFunction(runtimeI18n.baseUrl)) {
      import.meta.dev
        && console.warn('[nuxt-i18n] Configuring baseUrl as a function is deprecated and will be removed in v11.')
      return (): string => ''
    }

    return (event: H3Event): string => {
      if (__I18N_DOMAINS__) {
        // the origin of the current host, resolving it from `defaultLocale` would send a host
        // that serves no default locale to whichever domain that locale lives on
        return domainForHost(runtimeI18n.domainLocales, getRequestURL(event, { xForwardedHost: true })) || baseUrl
      }

      // if baseUrl is not determined by domain then prefer relative URL from server-side
      return ''
    }
  }

  const resolveRedirectPath = createRedirectResolver({
    detection,
    rootRedirect,
    redirectStatusCode: runtimeI18n.redirectStatusCode,
    matchLocalized,
    strategy: __I18N_STRATEGY__,
    routing: __I18N_ROUTING__,
    domains: __I18N_DOMAINS__,
  })

  const baseUrlGetter = createBaseUrlGetter()

  /**
   * Redirect moving a locale path to the domain that serves it, the target domain has its own
   * default locale so the path is prefixed for that domain rather than the current one.
   */
  const resolveRelocation = (event: H3Event, pathLocale: string, path: string) => {
    const origin = getDomainFromLocale(event, pathLocale)
    const host = normalizeDomain(origin)
    // a target on the current host would redirect to itself
    if (!origin || host === getRequestURL(event, { xForwardedHost: true }).host) { return }

    const relocated = matchLocalized(path, pathLocale, resolveDefaultLocale(host, _defaultLocale))
    if (!relocated) { return }

    return { path: relocated, code: runtimeI18n.redirectStatusCode ?? 302, locale: pathLocale, origin }
  }

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
    // `event.path` is already stripped of `app.baseURL` by Nitro (unlike `url.pathname`), and
    // `parsePath` drops any query string - so `path` stays an absolute, base-free route path.
    const { pathname } = parsePath(event.path)
    // a locale-prefixed root (`/ja`) leaves nothing behind the prefix, its route path is `/`
    const path = (pathLocale ? pathname.slice(pathLocale.length + 1) || '/' : pathname)

    // attempt to only run i18n detection for nuxt pages and i18n server routes
    if (!url.pathname.includes(__I18N_SERVER_ROUTE__) && !isExistingNuxtRoute(path)) {
      return
    }

    // a locale restricted to other domains cannot be served here, the request moves to a domain
    // that does serve it rather than rendering its path in the wrong locale
    const relocation = (__I18N_ROUTING__ && __I18N_DOMAINS__ && pathLocale && !detector.onHost(pathLocale)
      && resolveRelocation(event, pathLocale, path)) || undefined

    const resolved = relocation || resolveRedirectPath(event.path, path, pathLocale, ctx.vueI18nOptions!.defaultLocale, detector)
    if (resolved.path && (relocation || resolved.path !== pathname)) {
      ctx.detectLocale = resolved.locale
      // the origin host would not send the cookie to the domain being redirected to
      !relocation && detection.useCookie && setCookie(event, detection.cookieKey, resolved.locale, cookieOptions)
      context.response = createRedirectResponse(
        event,
        // the resolved path is base-free (matched against base-free routes), re-add `app.baseURL`
        joinURL(
          relocation?.origin || baseUrlGetter(event),
          useRuntimeConfig(event).app.baseURL,
          resolved.path + url.search,
        ),
        resolved.code,
      )
      return
    }
  })

  nitro.hooks.hook('render:html', (htmlContext, { event }) => {
    const ctx = tryUseI18nContext(event)
    if (__I18N_PRELOAD__) {
      if (ctx == null || Object.keys(ctx.messages ?? {}).length == 0) { return }

      // only the messages used in the current page - a prerendered one is served to every visitor,
      // so it keeps the whole set instead of the first render's keys
      if (__I18N_STRIP_UNUSED__ && !import.meta.prerender) {
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

      const payload = stringifyMessages(ctx.messages)
      if (payload != null) {
        htmlContext.bodyAppend.unshift(
          `<script type="application/json" data-nuxt-i18n="${appId}">${payload}</script>`,
        )
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

/**
 * Drops only the locales `devalue` cannot carry - a message function the build missed (#3880) would
 * otherwise cost every locale its payload. The whole tree is tried first, so it usually costs one pass.
 */
function stringifyMessages(messages: Record<string, unknown>) {
  try {
    return stringify(messages)
  } catch {
    const safe: Record<string, unknown> = {}
    for (const locale of Object.keys(messages)) {
      try {
        stringify(messages[locale])
        safe[locale] = messages[locale]
      } catch (e) {
        console.warn(`[nuxt-i18n] Dropped locale "${locale}" from the preload payload`, e)
      }
    }
    try {
      return stringify(safe)
    } catch (e) {
      console.warn('[nuxt-i18n] Could not serialize the preload payload', e)
    }
  }
}
