import createDebug from 'debug'
import { assign, isString } from '@intlify/shared'
import { genImport, genDynamicImport, genSafeVariableName, genString } from 'knitwork'
import { resolve, relative, join, basename } from 'pathe'
import { distDir, runtimeDir } from './dirs'
import { getLayerI18n } from './utils'
import { asI18nVirtual } from './transform/utils'

import type { Nuxt } from '@nuxt/schema'
import type { NuxtI18nOptions, LocaleObject } from './types'
import type { Locale } from 'vue-i18n'
import type { I18nNuxtContext } from './context'

const debug = createDebug('@nuxtjs/i18n:gen')

function stripLocaleFiles(locale: LocaleObject) {
  delete locale.files
  delete locale.file
  return locale
}

export function simplifyLocaleOptions(
  nuxt: Nuxt,
  options: Pick<NuxtI18nOptions, 'locales' | 'experimental' | 'i18nModules'>
) {
  const isLocaleObjectsArray = (locales?: Locale[] | LocaleObject[]) => locales?.some(x => !isString(x))

  const hasLocaleObjects =
    nuxt.options._layers.some(layer => isLocaleObjectsArray(getLayerI18n(layer)?.locales)) ||
    options?.i18nModules?.some(module => isLocaleObjectsArray(module?.locales))

  const locales = (options.locales ?? []) as LocaleObject[]
  return locales.map(locale => (!hasLocaleObjects ? locale.code : stripLocaleFiles(locale)))
}

type LocaleLoaderData = {
  key: string
  load: string
  relative: string
  cache: boolean
  specifier: string
  importString: string
}

export function generateLoaderOptions(
  ctx: Pick<I18nNuxtContext, 'options' | 'vueI18nConfigPaths' | 'localeInfo' | 'normalizedLocales'>,
  nuxt: Nuxt
) {
  debug('generateLoaderOptions: lazy', ctx.options.lazy)

  /**
   * Prepare locale file imports
   */
  const importMapper = new Map<string, LocaleLoaderData>()
  const localeLoaders: Record<string, LocaleLoaderData[]> = {}
  for (const locale of ctx.localeInfo) {
    localeLoaders[locale.code] ??= []
    for (const meta of locale.meta) {
      if (!importMapper.has(meta.path)) {
        const key = `locale_${genSafeVariableName(basename(meta.path))}_${meta.hash}`
        const specifier = asI18nVirtual(meta.hash)
        importMapper.set(meta.path, {
          specifier,
          key: genString(key),
          relative: meta.loadPath,
          cache: meta.file.cache ?? true,
          load: ctx.options.lazy
            ? genDynamicImport(specifier, { comment: `webpackChunkName: ${genString(key)}` })
            : `() => Promise.resolve(${key})`,
          importString: genImport(specifier, key)
        })
      }
      localeLoaders[locale.code].push(importMapper.get(meta.path)!)
    }
  }

  /**
   * Prepare Vue I18n config imports
   */
  const vueI18nConfigs = []
  for (let i = ctx.vueI18nConfigPaths.length - 1; i >= 0; i--) {
    const config = ctx.vueI18nConfigPaths[i]
    const key = genString(`config_${genSafeVariableName(basename(config.meta.path))}_${config.meta.hash}`)
    const specifier = asI18nVirtual(config.meta.hash)
    const importer = genDynamicImport(specifier, { comment: `webpackChunkName: ${key}` })
    vueI18nConfigs.push({ specifier, importer, relative: config.meta.loadPath })
  }

  const nuxtI18nOptions = assign({}, ctx.options, {
    locales: simplifyLocaleOptions(nuxt, ctx.options),
    i18nModules: (ctx.options.i18nModules ?? []).map(x => {
      delete x.langDir
      x.locales = (x.locales ?? []).map(locale => (isString(locale) ? locale : stripLocaleFiles(locale))) as
        | string[]
        | LocaleObject[]
      return x
    })
  })
  // @ts-expect-error is required
  delete nuxtI18nOptions.vueI18n

  /**
   * Process locale file paths in `normalizedLocales`
   */
  const normalizedLocales = ctx.normalizedLocales.map(x => stripLocaleFiles(x))

  return { localeLoaders, nuxtI18nOptions, vueI18nConfigs, normalizedLocales }
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

export function generateI18nTypes(nuxt: Nuxt, { userOptions: options, normalizedLocales }: I18nNuxtContext) {
  const vueI18nTypes = options.types === 'legacy' ? ['VueI18n'] : ['ExportedGlobalComposer', 'Composer']
  const generatedLocales = simplifyLocaleOptions(nuxt, options)
  const resolvedLocaleType = isString(generatedLocales) ? 'Locale[]' : 'LocaleObject[]'
  const narrowedLocaleType = normalizedLocales.map(x => JSON.stringify(x.code)).join(' | ') || 'string'

  const i18nType = `${vueI18nTypes.join(' & ')} & NuxtI18nRoutingCustomProperties<${resolvedLocaleType}>`

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
import type { ${vueI18nTypes.join(', ')} } from 'vue-i18n'
import type { NuxtI18nRoutingCustomProperties, ComposerCustomProperties } from '${relative(
    join(nuxt.options.buildDir, 'types'),
    resolve(runtimeDir, 'types.ts')
  )}'
import type { Strategies, Directions, LocaleObject } from '${relative(
    join(nuxt.options.buildDir, 'types'),
    resolve(distDir, 'types.d.ts')
  )}'

declare module 'vue-i18n' {
  interface ComposerCustom extends ComposerCustomProperties<${resolvedLocaleType}> {}
  interface ExportedGlobalComposer extends NuxtI18nRoutingCustomProperties<${resolvedLocaleType}> {}
  interface VueI18n extends NuxtI18nRoutingCustomProperties<${resolvedLocaleType}> {}
}

declare module '@intlify/core-base' {
  // generated based on configured locales
  interface GeneratedTypeConfig { 
    locale: ${narrowedLocaleType}
  }
}


declare module '#app' {
  interface NuxtApp {
    $i18n: ${i18nType}
  }
}

${typedRouterAugmentations}

${(options.experimental?.autoImportTranslationFunctions && globalTranslationTypes) || ''}

export {}`
}
