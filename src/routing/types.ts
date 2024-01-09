/* eslint-disable @typescript-eslint/no-explicit-any */

import type { STRATEGIES } from '../constants'
import type { RouteConfig as __Route, RouterOptions } from '@intlify/vue-router-bridge'
import type { Locale } from 'vue-i18n'
import type { Prefixable, SwitchLocalePathIntercepter } from './compatibles/types'

type UnionToIntersection<T> = (T extends any ? (k: T) => void : never) extends (k: infer U) => void ? U : never
type _Route = UnionToIntersection<__Route>

/**
 * Route config for lagacy vue-router v3
 *
 * @public
 */
export interface RouteLegacy extends Pick<_Route, Exclude<keyof _Route, 'children' | 'component'>> {
  chunkName?: string
  chunkNames?: Record<string, string>
  component?: _Route['component'] | string
  children?: RouteLegacy[]
}

/**
 * Route config for vue-router v4
 *
 * @public
 */
interface Route {
  name?: string
  path: string
  file?: string // for nuxt bridge & nuxt 3
  children?: Route[]
}

/**
 * Route config for vue-i18n-routing
 *
 * @public
 */
export type I18nRoute = Route & RouteLegacy & { redirect?: string }

/**
 * Routing strategy
 *
 * @public
 */
export type Strategies = (typeof STRATEGIES)[keyof typeof STRATEGIES]

/**
 * Direction
 *
 * @public
 */
export type Directions = 'ltr' | 'rtl' | 'auto'

/**
 * Locale object
 *
 * @public
 */
export interface LocaleObject extends Record<string, any> {
  code: Locale
  name?: string
  dir?: Directions
  domain?: string
  file?: string
  isCatchallLocale?: boolean
  iso?: string
}

/**
 * @public
 */
export type BaseUrlResolveHandler<Context = unknown> = (context: Context) => string

/**
 * Options to compute route localizing
 *
 * @remarks
 * The route options that is compute the route to be localized on {@link localizeRoutes}
 *
 * @public
 */
export interface ComputedRouteOptions {
  locales: readonly string[]
  paths: Record<string, string>
}

/**
 * Resolver for route localizing options
 *
 * @public
 */
export type RouteOptionsResolver = (route: I18nRoute, localeCodes: string[]) => ComputedRouteOptions | null

/**
 * Localize route path prefix judgment options used in {@link LocalizeRoutesPrefixable}
 *
 * @public
 */
export interface LocalizeRoutesPrefixableOptions {
  /**
   * Current locale
   */
  currentLocale: Locale
  /**
   * Default locale
   */
  defaultLocale: Locale
  /**
   * Curernt strategy
   */
  strategy: Strategies
  /**
   * Whether the route to be resolved is child or not
   */
  isChild: boolean
  /**
   * The path of route
   */
  path: string
}

/**
 * Localize route path prefix judgment logic in {@link localizeRoutes} function
 *
 * @public
 */
export type LocalizeRoutesPrefixable = (options: LocalizeRoutesPrefixableOptions) => boolean

/**
 * Options to initialize a VueRouter instance
 *
 * @remarks
 * This options is extended from Vue Router `RouterOptioins`, so you can specify those options.
 *
 * @public
 */
export type I18nRoutingOptions<Context = unknown> = {
  /**
   * Vue Router version
   *
   * @remarks
   * You can choice between vue-router v3 and v4.
   *
   * If you specify `3`, this function return Vue Router v3 instance, else specify `4`, this function return Vue Router v4 instance.
   *
   * @defaultValue 4
   */
  version?: 3 | 4
  /**
   * The app's default locale
   *
   * @remarks
   * When using `prefix_except_default` strategy, URLs for locale specified here won't have a prefix.
   *
   * It's recommended to set this to some locale regardless of chosen strategy, as it will be used as a fallback locale when navigating to a non-existent route
   *
   * @defaultValue '' (emputy string)
   */
  defaultLocale?: string
  /**
   * List of locales supported by your app
   *
   * @remarks
   * Can either be an array of string codes (e.g. `['en', 'fr']`) or an array of {@link LocaleObject} for more complex configurations
   *
   * @defaultValue []
   */
  locales?: string[] | LocaleObject[]
  /**
   * Routes strategy
   *
   * @remarks
   * Can be set to one of the following:
   *
   * - `no_prefix`: routes won't have a locale prefix
   * - `prefix_except_default`: locale prefix added for every locale except default
   * - `prefix`: locale prefix added for every locale
   * - `prefix_and_default`: locale prefix added for every locale and default
   *
   * @defaultValue 'prefix_except_default'
   */
  strategy?: Strategies
  /**
   * Whether to use trailing slash
   *
   * @defaultValue false
   */
  trailingSlash?: boolean
  /**
   * Internal separator used for generated route names for each locale. You shouldn't need to change this
   *
   * @defaultValue '___'
   */
  routesNameSeparator?: string
  /**
   * Internal suffix added to generated route names for default locale
   *
   * @remarks
   * if strategy is prefix_and_default. You shouldn't need to change this.
   *
   * @defaultValue 'default'
   */
  defaultLocaleRouteNameSuffix?: string
  /**
   * Default direction direction
   *
   * @defaultValue 'ltr'
   */
  defaultDirection?: Directions
  /**
   * The fallback base URL to use as a prefix for alternate URLs in hreflang tags.
   *
   * @remarks
   * By default VueRouter's base URL will be used and only if that is not available, fallback URL will be used.
   *
   * Can also be a function (will be passed a Nuxt Context as a parameter) that returns a string.
   *
   * Useful to make base URL dynamic based on request headers.
   *
   * @defaultValue ''
   */
  baseUrl?: string | BaseUrlResolveHandler<Context>
  /**
   * Route options resolver
   *
   * @defaultValue undefined
   */
  routeOptionsResolver?: RouteOptionsResolver
  /**
   * Whether to prefix the route path with the locale or not
   *
   * @defaultValue {@link DefaultPrefixable}
   */
  prefixable?: Prefixable
  /**
   * An option that Intercepter for custom processing for paths resolved with {@link switchLocalePath}
   *
   * @defaultValue {@link DefaultSwitchLocalePathIntercepter}
   */
  switchLocalePathIntercepter?: SwitchLocalePathIntercepter
  /**
   * Whether to prefix the localize route path with the locale or not
   *
   * @defaultValue {@link DefaultLocalizeRoutesPrefixable}
   */
  localizeRoutesPrefixable?: LocalizeRoutesPrefixable
  /**
   * The key which to access vue router meta object, when dynamic route params need localize.
   *
   * @defaultValue ''
   */
  dynamicRouteParamsKey?: string | symbol
} & RouterOptions

export type { Route, RouteLocationNormalized, RouteLocationNormalizedLoaded } from '@intlify/vue-router-bridge'

/* eslint-enable @typescript-eslint/no-explicit-any */
