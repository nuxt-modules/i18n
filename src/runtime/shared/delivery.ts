import type { Locale } from 'vue-i18n'

export interface DeliveryConfig {
  ssr: boolean
  /** Deployed without a server, leaving only what was prerendered */
  ssg: boolean
  /** Messages are being produced while prerendering */
  prerender: boolean
  /** Locales whose messages can only be produced by running their loaders */
  dynamic: string[]
  /**
   * Locales the endpoint has no response for: JSON would drop their message functions (#3880), or
   * the server cannot run their loaders at all (#3940)
   */
  undeliverable: string[]
}

/**
 * Whether a locale's endpoint response is worth baking into a file: a dynamic locale's would shadow
 * the handler that still resolves it per request, and an undeliverable one has no response to bake.
 * Being the only responses that exist as files, these are also the only ones a CDN can hold. Not the
 * same as "the endpoint can serve it" - a live handler serves a dynamic locale fine, by running its
 * loader in-process.
 */
export function createPrerenderablePredicate(config: Pick<DeliveryConfig, 'dynamic' | 'undeliverable'>) {
  return (locale: Locale) => !config.dynamic.includes(locale) && !config.undeliverable.includes(locale)
}

/**
 * Whether a locale's messages have to be produced by running its loaders rather than read from the
 * messages endpoint. `appLoad` in `src/template.ts` decides whether those loaders are in the graph
 * at all - the two have to agree, or a locale is loaded from a stub or fetched from a route that
 * was never rendered.
 */
export function createRuntimeLoaderPredicate(config: DeliveryConfig) {
  return (locale: Locale) =>
    !config.ssr
    || config.undeliverable.includes(locale)
    || (config.dynamic.includes(locale) && (config.prerender || config.ssg))
}

/**
 * Path segments after the server route prefix for a locale's messages endpoint. The route matches
 * `:hash/:locale/messages.json` as single segments, and a locale code is free to contain characters
 * (`/`, `?`, ...) that would otherwise split into extra segments or corrupt the URL, so it gets
 * encoded here to keep the request a single segment. h3 decodes route params back to the original
 * locale on the way in (#4036).
 */
export function messagesRoutePath(hash: string, locale: Locale): string {
  return `${hash}/${encodeURIComponent(locale)}/messages.json`
}

/**
 * Whether a locale code needs percent-encoding to fit `messagesRoutePath` as a single path segment.
 * Nitro's own prerender crawler can only carry a route through unencoded (it round-trips every
 * queued route through `decodeURI`/`encodeURI`, which never reproduces a pre-encoded segment), so a
 * locale like this can never be baked into a static messages file - callers treat it as `dynamic`
 * and have it run its own loaders instead, wherever there's no live server left to fall back on
 * (prerendering, static hosting) (#4142).
 */
export function localeNeedsPathEncoding(locale: Locale): boolean {
  return encodeURIComponent(locale) !== locale
}
