/* eslint-disable @typescript-eslint/no-explicit-any */

import createDebug from 'debug'
import { EXECUTABLE_EXTENSIONS, NUXT_I18N_MODULE_ID } from './constants'
import { genImport, genDynamicImport } from 'knitwork'
import { withQuery } from 'ufo'
import { getLocalePaths, toCode } from './utils'

import type { NuxtI18nOptions, NuxtI18nInternalOptions, LocaleInfo, VueI18nConfigPathInfo, FileMeta } from './types'
import type { NuxtI18nOptionsDefault } from './constants'
import type { LocaleObject } from 'vue-i18n-routing'

export type LoaderOptions = {
  localeCodes?: string[]
  localeInfo?: LocaleInfo[]
  nuxtI18nOptions?: NuxtI18nOptions
  nuxtI18nOptionsDefault?: NuxtI18nOptionsDefault
  nuxtI18nInternalOptions?: NuxtI18nInternalOptions
}

type ResourceType = 'locale' | 'config'

const debug = createDebug('@nuxtjs/i18n:gen')

const generateVueI18nConfiguration = (config: Required<VueI18nConfigPathInfo>): string => {
  return genDynamicImport(genImportSpecifier(config.meta, 'config'), {
    comment: `webpackChunkName: ${config.meta.key}`
  })
}

function simplifyLocaleOptions(locales: LocaleObject[]) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return locales.map(({ meta, ...locale }) => {
    if (
      locale?.files == null ||
      (locale?.files?.length === 0 &&
        Object.keys(locale).filter(k => !['iso', 'code', 'hashes', 'types', 'file', 'files'].includes(k)).length === 0)
    ) {
      return locale.code
    }

    return { ...locale, files: getLocalePaths(locale) }
  })
}

export function generateLoaderOptions(
  lazy: NonNullable<NuxtI18nOptions['lazy']>,
  vueI18nConfigPaths: Required<VueI18nConfigPathInfo>[],
  options: LoaderOptions = {},
  misc: {
    dev: boolean
    ssg: boolean
    parallelPlugin: boolean
  } = { dev: true, ssg: false, parallelPlugin: false }
) {
  debug('generateLoaderOptions: lazy', lazy)

  const importMapper = new Map<string, { key: string; load: string; cache: string }>()
  const importStrings: string[] = []

  function generateLocaleImports(locale: string, meta: NonNullable<LocaleInfo['meta']>[number]) {
    if (importMapper.has(meta.key)) return
    const importSpecifier = genImportSpecifier(meta, 'locale', { locale })
    const importer = { code: locale, key: meta.loadPath, load: '', cache: meta.file.cache ?? true }

    if (lazy) {
      importer.load = genDynamicImport(importSpecifier, { comment: `webpackChunkName: "${meta.key}"` })
    } else {
      const assertFormat = meta.parsed.ext.slice(1)
      const importOptions = assertFormat ? { assert: { type: assertFormat } } : {}
      importStrings.push(genImport(importSpecifier, meta.key, importOptions))

      importer.load = `() => Promise.resolve(${meta.key})`
    }

    importMapper.set(meta.key, {
      key: toCode(importer?.key),
      load: importer?.load,
      cache: toCode(importer?.cache)
    })
  }

  options.localeInfo ??= []

  /**
   * Prepare locale file imports
   */
  for (const locale of options.localeInfo) {
    locale?.meta?.forEach(meta => generateLocaleImports(locale.code, meta))
  }

  /**
   * Reverse order so project overwrites layers
   */
  const vueI18nConfigImports = vueI18nConfigPaths
    .reverse()
    .filter(config => config.absolute !== '')
    .map(config => generateVueI18nConfiguration(config))
    .filter((x): x is string => x != null)

  const localeMessages = options.localeInfo.map(locale => [
    locale.code,
    locale.meta?.map(meta => importMapper.get(meta.key))
  ])

  const nuxtI18nOptions = {
    ...options.nuxtI18nOptions,
    locales: simplifyLocaleOptions((options?.nuxtI18nOptions?.locales ?? []) as unknown as LocaleObject[])
  }
  delete nuxtI18nOptions.vueI18n

  const generated = {
    localeCodes: options.localeCodes ?? [],
    importStrings,
    localeMessages,
    NUXT_I18N_MODULE_ID: toCode(NUXT_I18N_MODULE_ID),
    isSSG: misc.ssg,
    parallelPlugin: misc.parallelPlugin,
    nuxtI18nOptions,
    nuxtI18nInternalOptions: options.nuxtI18nInternalOptions ?? {},
    nuxtI18nOptionsDefault: options.nuxtI18nOptionsDefault ?? {},
    vueI18nConfigs: vueI18nConfigImports
  }

  debug('generate code', generated)

  return generated
}

function genImportSpecifier(
  { loadPath, path, parsed, hash, type }: Pick<FileMeta, 'loadPath' | 'path' | 'parsed' | 'hash' | 'type'>,
  resourceType: ResourceType | undefined,
  query: Record<string, string> = {}
) {
  if (!EXECUTABLE_EXTENSIONS.includes(parsed.ext)) return loadPath

  if (resourceType != null && type === 'unknown') {
    throw new Error(`'unknown' type in '${path}'.`)
  }

  if (resourceType === 'locale') {
    return withQuery(loadPath, type === 'dynamic' ? { hash, ...query } : {})
  }

  if (resourceType === 'config') {
    return withQuery(loadPath, { hash, ...query, ...{ config: 1 } })
  }

  return loadPath
}

/* eslint-enable @typescript-eslint/no-explicit-any */
