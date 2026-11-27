import type { Locale } from 'vue-i18n'

export interface DeliveryConfig {
  /** Pages are rendered on the server */
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
  /**
   * Locales configured without files: the endpoint would only answer `{}`, so nothing is fetched or
   * prerendered for them. Not undeliverable - their payload copy still carries what the server holds
   */
  fileless: string[]
}

/**
 * Whether a locale's endpoint response is worth baking into a file: a dynamic locale's would shadow
 * the handler that still resolves it per request, and an undeliverable one has no response to bake.
 * Being the only responses that exist as files, these are also the only ones a CDN can hold. Not the
 * same as "the endpoint can serve it" - a live handler serves a dynamic locale fine, by running its
 * loader in-process. A fileless locale's response would be `{}`.
 */
export function createPrerenderablePredicate(config: Pick<DeliveryConfig, 'dynamic' | 'undeliverable' | 'fileless'>) {
  return (locale: Locale) =>
    !config.dynamic.includes(locale) && !config.undeliverable.includes(locale) && !config.fileless.includes(locale)
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
 * Whether loading a locale requests the messages endpoint: not when its loaders produce the messages,
 * and not when it has no files, whose response would hold nothing but the fallbacks loaded on their own.
 */
export function createEndpointPredicate(usesRuntimeLoaders: (locale: Locale) => boolean, fileless: string[]) {
  return (locale: Locale) => !usesRuntimeLoaders(locale) && !fileless.includes(locale)
}
