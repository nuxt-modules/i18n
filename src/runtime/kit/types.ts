/** @internal */
export type Locale = { code: string; language?: string }

/** @internal */
export type RouteName = string | symbol | null | undefined

/** @internal */
export type RouteObject = { name?: RouteName; path?: string }

/** @internal */
export type HeadLocale = {
  /** Code used for route prefixing and argument in i18n utility functions. */
  code: string
  /** User facing name */
  name?: string
  /** Writing direction */
  dir?: 'ltr' | 'rtl' | 'auto'
  /** Language tag - see IETF's BCP47 - required when using SEO features */
  language?: string
  /** Override default SEO catch-all and force this locale to be catch-all for its locale group */
  isCatchallLocale?: boolean
}

/**
 * The browser locale code and match score
 * @internal
 */
export interface BrowserLocale {
  /** The locale code, such as BCP 47 (e.g `en-US`), or `ja` */
  code: string
  /** The match score - used to sort multiple matched locales */
  score: number
}
