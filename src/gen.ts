import createDebug from 'debug'
import { genImport, genDynamicImport, genSafeVariableName, genString } from 'knitwork'
import { resolve, relative, join, basename } from 'pathe'
import { distDir, runtimeDir } from './dirs'
import { getLayerI18n, getLocalePaths, getNormalizedLocales } from './utils'
import { asI18nVirtual } from './transform/utils'

import type { Nuxt } from '@nuxt/schema'
import type { NuxtI18nOptions, LocaleInfo, VueI18nConfigPathInfo, LocaleObject, LocaleFile } from './types'
import type { Locale } from 'vue-i18n'
import type { I18nNuxtContext } from './context'

export type LoaderOptions = {
  vueI18nConfigPaths: Required<VueI18nConfigPathInfo>[]
  localeInfo: LocaleInfo[]
  nuxtI18nOptions: NuxtI18nOptions
  normalizedLocales: LocaleObject<string>[]
}

const debug = createDebug('@nuxtjs/i18n:gen')

export function simplifyLocaleOptions(
  nuxt: Nuxt,
  options: Pick<NuxtI18nOptions, 'locales' | 'experimental' | 'i18nModules'>
) {
  const isLocaleObjectsArray = (locales?: Locale[] | LocaleObject[]) => locales?.some(x => typeof x !== 'string')

  const hasLocaleObjects =
    nuxt.options._layers.some(layer => isLocaleObjectsArray(getLayerI18n(layer)?.locales)) ||
    options?.i18nModules?.some(module => isLocaleObjectsArray(module?.locales))

  const locales = (options.locales ?? []) as LocaleObject[]
  const pathFormat = options.experimental?.generatedLocaleFilePathFormat ?? 'absolute'

  return locales.map(({ meta, ...locale }) => {
    if (!hasLocaleObjects) {
      return locale.code
    }

    if (locale.file || (locale.files?.length ?? 0) > 0) {
      locale.files = getLocalePaths(locale)

      if (pathFormat === 'relative') {
        locale.files = locale.files.map(x => relative(nuxt.options.rootDir, x))
      }
    } else {
      delete locale.files
    }
    delete locale.file

    return locale
  })
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

  const importMapper = new Map<string, LocaleLoaderData>()
  function generateLocaleImports(meta: NonNullable<LocaleInfo['meta']>[number]) {
    if (importMapper.has(meta.path)) return importMapper.get(meta.path)!
    const key = `locale_${genSafeVariableName(basename(meta.path))}_${meta.hash}`
    const specifier = asI18nVirtual(meta.hash)
    const async = genDynamicImport(specifier, { comment: `webpackChunkName: ${genString(key)}` })
    const sync = `() => Promise.resolve(${key})`

    importMapper.set(meta.path, {
      specifier,
      key: genString(key),
      relative: meta.loadPath,
      cache: meta.file.cache ?? true,
      load: ctx.options.lazy ? async : sync,
      importString: genImport(specifier, key)
    })

    return importMapper.get(meta.path)!
  }

  /**
   * Prepare locale file imports
   */
  const localeLoaders: Record<string, LocaleLoaderData[]> = {}
  for (const locale of ctx.localeInfo) {
    localeLoaders[locale.code] = (locale?.meta ?? []).map(meta => generateLocaleImports(meta))
  }

  /**
   * Prepare Vue I18n config imports
   */
  const vueI18nConfigs = []
  for (let i = ctx.vueI18nConfigPaths.length - 1; i >= 0; i--) {
    const config = ctx.vueI18nConfigPaths[i]
    if (config.meta.path === '') continue
    const key = genString(`config_${genSafeVariableName(basename(config.meta.path))}_${config.meta.hash}`)
    const specifier = asI18nVirtual(config.meta.hash)
    const importer = genDynamicImport(specifier, { comment: `webpackChunkName: ${key}` })
    vueI18nConfigs.push({ specifier, importer, relative: config.meta.loadPath })
  }

  const pathFormat = ctx.options.experimental?.generatedLocaleFilePathFormat ?? 'absolute'

  const nuxtI18nOptions = {
    ...ctx.options,
    locales: simplifyLocaleOptions(nuxt, ctx.options),
    i18nModules: (ctx.options.i18nModules ?? []).map(x => {
      if (pathFormat === 'absolute' || x.langDir == null) return x
      return { ...x, langDir: relative(nuxt.options.rootDir, x.langDir) }
    })
  }
  // @ts-expect-error is required
  delete nuxtI18nOptions.vueI18n

  /**
   * Process locale file paths in `normalizedLocales`
   */
  const normalizedLocales = ctx.normalizedLocales.map(x => {
    if (pathFormat === 'absolute') return x
    if (x.files == null) return x

    return {
      ...x,
      files: x.files.map(f => {
        if (typeof f === 'string') return relative(nuxt.options.rootDir, f)
        return { ...f, path: relative(nuxt.options.rootDir, f.path) }
      }) as string[] | LocaleFile[]
    }
  })

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

export function generateI18nTypes(nuxt: Nuxt, options: NuxtI18nOptions) {
  const vueI18nTypes = options.types === 'legacy' ? ['VueI18n'] : ['ExportedGlobalComposer', 'Composer']
  const generatedLocales = simplifyLocaleOptions(nuxt, options)
  const resolvedLocaleType = typeof generatedLocales === 'string' ? 'Locale[]' : 'LocaleObject[]'
  const localeCodeStrings = getNormalizedLocales(options.locales).map(x => JSON.stringify(x.code))
  const narrowedLocaleType = localeCodeStrings.join(' | ') || 'string'

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
