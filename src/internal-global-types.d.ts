/* eslint-disable no-var, @typescript-eslint/no-redundant-type-constituents */
import type { Composer, ExportedGlobalComposer, VueI18n } from 'vue-i18n'
import type { ComposerCustomProperties, NuxtI18nRoutingCustomProperties } from './runtime/types'

declare module 'vue-i18n' {
  interface ComposerCustom extends ComposerCustomProperties {}
  interface ExportedGlobalComposer extends NuxtI18nRoutingCustomProperties {}
  interface VueI18n extends NuxtI18nRoutingCustomProperties {}
}

declare module '#app' {
  interface NuxtApp {
    $i18n: VueI18n & ExportedGlobalComposer & Composer & NuxtI18nRoutingCustomProperties & I18nRoutingCustomProperties
  }
}

// This needs to be generated, or else `RouteMapI18n` will fall back to `RouteMapGeneric`
// declare module 'vue-router' {
//   import type { RouteNamedMapI18n } from 'vue-router/auto-routes'

//   export interface TypesConfig {
//     RouteNamedMapI18n: RouteNamedMapI18n
//   }
// }

declare module 'vue-router' {
  export type RouteMapI18n =
    TypesConfig extends Record<'RouteNamedMapI18n', infer RouteNamedMap> ? RouteNamedMap : RouteMapGeneric

  export type RouteLocationRawI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n
      ? RouteLocationAsStringI18n | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric
      :
          | _LiteralUnion<RouteLocationAsStringTypedList<RouteMapI18n>[Name], string>
          | RouteLocationAsRelativeTypedList<RouteMapI18n>[Name]

  export type RouteLocationResolvedI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n
      ? RouteLocationResolvedGeneric
      : RouteLocationResolvedTypedList<RouteMapI18n>[Name]

  export interface RouteLocationNormalizedLoadedTypedI18n<
    RouteMapI18n extends RouteMapGeneric = RouteMapGeneric,
    Name extends keyof RouteMapI18n = keyof RouteMapI18n
  > extends RouteLocationNormalizedLoadedGeneric {
    name: Extract<Name, string | symbol>
    params: RouteMapI18n[Name]['params']
  }
  export type RouteLocationNormalizedLoadedTypedListI18n<RouteMapOriginal extends RouteMapGeneric = RouteMapGeneric> = {
    [N in keyof RouteMapOriginal]: RouteLocationNormalizedLoadedTypedI18n<RouteMapOriginal, N>
  }
  export type RouteLocationNormalizedLoadedI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n
      ? RouteLocationNormalizedLoadedGeneric
      : RouteLocationNormalizedLoadedTypedListI18n<RouteMapI18n>[Name]

  type _LiteralUnion<LiteralType, BaseType extends string = string> = LiteralType | (BaseType & Record<never, never>)

  export type RouteLocationAsStringI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n
      ? string
      : _LiteralUnion<RouteLocationAsStringTypedList<RouteMapI18n>[Name], string>

  export type RouteLocationAsStringI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n
      ? string
      : _LiteralUnion<RouteLocationAsStringTypedList<RouteMapI18n>[Name], string>

  export type RouteLocationAsRelativeI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n
      ? RouteLocationAsRelativeGeneric
      : RouteLocationAsRelativeTypedList<RouteMapI18n>[Name]

  export type RouteLocationAsPathI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n ? RouteLocationAsPathGeneric : RouteLocationAsPathTypedList<RouteMapI18n>[Name]

  /**
   * Helper to generate a type safe version of the {@link RouteLocationAsRelative} type.
   */
  export interface RouteLocationAsRelativeTyped<
    RouteMapI18n extends RouteMapGeneric = RouteMapGeneric,
    Name extends keyof RouteMapI18n = keyof RouteMapI18n
  > extends RouteLocationAsRelativeGeneric {
    name?: Extract<Name, string | symbol>
    params?: RouteMapI18n[Name]['paramsRaw']
  }
}

declare global {
  var $t: Composer['t']
  var $rt: Composer['rt']
  var $n: Composer['n']
  var $d: Composer['d']
  var $tm: Composer['tm']
  var $te: Composer['te']
}

export {}

/* eslint-enable no-var, @typescript-eslint/no-redundant-type-constituents */
