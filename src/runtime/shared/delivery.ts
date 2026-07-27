import type { Locale } from 'vue-i18n'

export interface DeliveryConfig {
  ssr: boolean
  /** Deployed without a server, leaving only what was prerendered */
  ssg: boolean
  /** Messages are being produced while prerendering */
  prerender: boolean
  /** Locales whose messages can only be produced by running their loaders */
  dynamic: string[]
  /** Locales the endpoint cannot deliver, because JSON would drop their message functions */
  unserializable: string[]
}

/**
 * Whether a locale's endpoint response is worth baking into a file: a dynamic locale's would shadow
 * the handler that still resolves it per request, and an unserializable one's would have had its
 * message functions stripped. Being the only responses that exist as files, these are also the only
 * ones a CDN can hold. Not the same as "the endpoint can serve it" - a live handler serves a dynamic
 * locale fine, by running its loader in-process.
 */
export function createPrerenderablePredicate(config: Pick<DeliveryConfig, 'dynamic' | 'unserializable'>) {
  return (locale: Locale) => !config.dynamic.includes(locale) && !config.unserializable.includes(locale)
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
    || config.unserializable.includes(locale)
    || (config.dynamic.includes(locale) && (config.prerender || config.ssg))
}
