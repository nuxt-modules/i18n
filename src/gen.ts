import { isString } from '@intlify/shared'
import { genDynamicImport, genSafeVariableName, genString } from 'knitwork'
import { resolve, relative, join, basename } from 'pathe'
import { asI18nVirtual } from './transform/utils'

import type { Nuxt } from '@nuxt/schema'
import type { LocaleObject } from './types'
import type { I18nNuxtContext } from './context'

function stripLocaleFiles(locale: LocaleObject) {
  delete locale.files
  delete locale.file
  return locale
}

export function simplifyLocaleOptions(ctx: I18nNuxtContext, _nuxt: Nuxt) {
  const locales = (ctx.options.locales ?? []) as LocaleObject[]
  const hasLocaleObjects = locales?.some(x => !isString(x))
  return locales.map(locale => (!hasLocaleObjects ? locale.code : stripLocaleFiles(locale)))
}

type LocaleLoaderData = {
  key: string
  load: string
  relative: string
  cache: boolean
}

export function generateLoaderOptions(
  ctx: Pick<I18nNuxtContext, 'options' | 'vueI18nConfigPaths' | 'localeInfo' | 'normalizedLocales'>,
  nuxt: Nuxt
) {
  /**
   * Prepare locale file imports
   */
  const importMapper = new Map<string, LocaleLoaderData>()
  const localeLoaders: Record<string, LocaleLoaderData[]> = {}
  for (const locale of ctx.localeInfo) {
    localeLoaders[locale.code] ??= []
    for (const meta of locale.meta) {
      if (!importMapper.has(meta.path)) {
        const key = genString(`locale_${genSafeVariableName(basename(meta.path))}_${meta.hash}`)
        importMapper.set(meta.path, {
          key,
          relative: relative(nuxt.options.buildDir, meta.path),
          cache: meta.cache ?? true,
          load: genDynamicImport(asI18nVirtual(meta.hash), { comment: `webpackChunkName: ${key}` })
        })
      }
      localeLoaders[locale.code]!.push(importMapper.get(meta.path)!)
    }
  }

  /**
   * Prepare Vue I18n config imports
   */
  const vueI18nConfigs = []
  for (let i = ctx.vueI18nConfigPaths.length - 1; i >= 0; i--) {
    const config = ctx.vueI18nConfigPaths[i]!
    const key = genString(`config_${genSafeVariableName(basename(config.path))}_${config.hash}`)
    vueI18nConfigs.push({
      importer: genDynamicImport(asI18nVirtual(config.hash), { comment: `webpackChunkName: ${key}` }),
      relative: relative(nuxt.options.buildDir, config.path)
    })
  }

  /**
   * Process locale file paths in `normalizedLocales`
   */
  const normalizedLocales = ctx.normalizedLocales.map(x => stripLocaleFiles(x))

  return { localeLoaders, vueI18nConfigs, normalizedLocales }
}

/**
 * From vuejs/router
 * https://github.com/vuejs/router/blob/14219b01bee142423265a3aaacd1eac0dcc95071/packages/router/src/typed-routes/route-map.ts
 * https://github.com/vuejs/router/blob/14219b01bee142423265a3aaacd1eac0dcc95071/packages/router/src/typed-routes/route-location.ts
 *
 * Depends on `TypesConfig`
 * https://github.com/vuejs/router/blob/14219b01bee142423265a3aaacd1eac0dcc95071/packages/router/src/config.ts#L14
 * Depends on the same mechanism of `RouteNamedMap
 * https://github.com/vuejs/router/blob/14219b01bee142423265a3aaacd1eac0dcc95071/packages/router/vue-router-auto.d.ts#L4
 */
const typedRouterAugmentations = `
declare module 'vue-router' {
  import type { RouteNamedMapI18n } from 'vue-router/auto-routes'

  export interface TypesConfig {
    RouteNamedMapI18n: RouteNamedMapI18n
  }

  export type RouteMapI18n =
    TypesConfig extends Record<'RouteNamedMapI18n', infer RouteNamedMap> ? RouteNamedMap : RouteMapGeneric
    
  // Prefer named resolution for i18n
  export type RouteLocationNamedI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
      | Name
      | Omit<RouteLocationAsRelativeI18n, 'path'> & { path?: string }
      /**
       * Note: disabled route path string autocompletion, this can break depending on \`strategy\`
       * this can be enabled again after route resolve has been improved.
      */
      // | RouteLocationAsStringI18n
      // | RouteLocationAsPathI18n

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

  export type RouteLocationAsRelativeI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n
      ? RouteLocationAsRelativeGeneric
      : RouteLocationAsRelativeTypedList<RouteMapI18n>[Name]

  export type RouteLocationAsPathI18n<Name extends keyof RouteMapI18n = keyof RouteMapI18n> =
    RouteMapGeneric extends RouteMapI18n ? RouteLocationAsPathGeneric : RouteLocationAsPathTypedList<RouteMapI18n>[Name]

  /**
   * Helper to generate a type safe version of the {@link RouteLocationAsRelative} type.
   */
  export interface RouteLocationAsRelativeTypedI18n<
    RouteMapI18n extends RouteMapGeneric = RouteMapGeneric,
    Name extends keyof RouteMapI18n = keyof RouteMapI18n
  > extends RouteLocationAsRelativeGeneric {
    name?: Extract<Name, string | symbol>
    params?: RouteMapI18n[Name]['paramsRaw']
  }
}`

export function generateI18nTypes(nuxt: Nuxt, ctx: I18nNuxtContext) {
  const legacyTypes = ctx.userOptions.types === 'legacy'
  const i18nType = legacyTypes ? 'VueI18n' : 'Composer'
  const generatedLocales = simplifyLocaleOptions(ctx, nuxt)
  const resolvedLocaleType = isString(generatedLocales.at(0)) ? 'Locale[]' : 'LocaleObject[]'
  const narrowedLocaleType = ctx.localeCodes.map(x => JSON.stringify(x)).join(' | ') || 'string'

  const globalTranslationTypes = `
declare global {
  var $t: (${i18nType})['t']
  var $rt: (${i18nType})['rt']
  var $n: (${i18nType})['n']
  var $d: (${i18nType})['d']
  var $tm: (${i18nType})['tm']
  var $te: (${i18nType})['te']
}`

  // prettier-ignore
  return `// Generated by @nuxtjs/i18n
import type { ${i18nType} } from 'vue-i18n'
import type { ComposerCustomProperties } from '${relative(
    join(nuxt.options.buildDir, 'types'),
    resolve(ctx.runtimeDir, 'types.ts')
  )}'
import type { Strategies, Directions, LocaleObject } from '${relative(
    join(nuxt.options.buildDir, 'types'),
    resolve(ctx.distDir, 'types.d.mts')
  )}'
import type { I18nRoute } from '#i18n'

declare module 'vue-i18n' {
  interface ComposerCustom extends ComposerCustomProperties<${resolvedLocaleType}> {}
  interface ExportedGlobalComposer extends ComposerCustomProperties<${resolvedLocaleType}> {}
  interface VueI18n extends ComposerCustomProperties<${resolvedLocaleType}> {}
}

declare module '@intlify/core-base' {
  // generated based on configured locales
  interface GeneratedTypeConfig { 
    locale: ${narrowedLocaleType}
    legacy: ${legacyTypes}
  }
}

interface I18nMeta {
  i18n?: I18nRoute | false
}

declare module '#app' {
  interface NuxtApp {
    $i18n: ${i18nType}
  }
  interface PageMeta extends I18nMeta {}
}


declare module 'vue-router' {
  interface RouteMeta extends I18nMeta {}
}

${typedRouterAugmentations}

${(ctx.userOptions.autoDeclare && globalTranslationTypes) || ''}

export {}`
}
