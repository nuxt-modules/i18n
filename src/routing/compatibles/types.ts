/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Locale } from 'vue-i18n'
import type { LocalizeRoutesPrefixableOptions } from '../types'

/**
 * SEO Attribute options.
 *
 * @public
 */
export interface SeoAttributesOptions {
  /**
   * An array of strings corresponding to query params you would like to include in your canonical URL.
   *
   * @defaultValue []
   */
  canonicalQueries?: string[]
}

/**
 * Options for {@link localeHead} function.
 *
 * @public
 */
export interface I18nHeadOptions {
  /**
   * Adds a `dir` attribute to the HTML element.
   *
   * @defaultValue false
   */
  addDirAttribute?: boolean
  /**
   * Adds various SEO attributes.
   *
   * @defaultValue false
   */
  addSeoAttributes?: boolean | SeoAttributesOptions
  /**
   * Identifier attribute of `<meta>` tag
   *
   * @defaultValue 'hid'
   */
  identifierAttribute?: string
}

/**
 * Meta attributes for head properties.
 *
 * @public
 */
export type MetaAttrs = Record<string, any>

/**
 * I18n header meta info.
 *
 * @public
 */
export interface I18nHeadMetaInfo {
  htmlAttrs?: MetaAttrs
  meta?: MetaAttrs[]
  link?: MetaAttrs[]
}

/**
 * Route path prefix judgment options used in {@link Prefixable}
 */
export type PrefixableOptions = Pick<LocalizeRoutesPrefixableOptions, 'currentLocale' | 'defaultLocale' | 'strategy'>

/**
 * Route path prefix judgment logic in {@link resolveRoute} function
 */
export type Prefixable = (optons: PrefixableOptions) => boolean

/**
 * The intercept handler which is called in {@link switchLocalePath} function
 */
export type SwitchLocalePathIntercepter = (path: string, locale: Locale) => string

/* eslint-enable @typescript-eslint/no-explicit-any */
