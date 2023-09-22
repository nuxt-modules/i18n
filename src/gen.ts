/* eslint-disable @typescript-eslint/no-explicit-any */

import createDebug from 'debug'
import { EXECUTABLE_EXTENSIONS } from './constants'
import { genImport, genDynamicImport } from 'knitwork'
import { withQuery } from 'ufo'
import { PrerenderTarget, getLocalePaths, toCode } from './utils'

import type { NuxtI18nOptions, LocaleInfo, VueI18nConfigPathInfo, FileMeta } from './types'
import type { LocaleObject } from 'vue-i18n-routing'

export type LoaderOptions = {
  vueI18nConfigPaths: Required<VueI18nConfigPathInfo>[]
  localeInfo: LocaleInfo[]
  nuxtI18nOptions: NuxtI18nOptions
}

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

export function generateLoaderOptions({ nuxtI18nOptions, vueI18nConfigPaths, localeInfo }: LoaderOptions) {
  debug('generateLoaderOptions: lazy', nuxtI18nOptions.lazy)

  const importMapper = new Map<string, { key: string; load: string; cache: string }>()
  const importStrings: string[] = []

  function generateLocaleImports(locale: string, meta: NonNullable<LocaleInfo['meta']>[number]) {
    if (importMapper.has(meta.key)) return
    const importSpecifier = genImportSpecifier(meta, 'locale', { locale })
    const importer = { code: locale, key: meta.loadPath, load: '', cache: meta.file.cache ?? true }

    if (nuxtI18nOptions.lazy) {
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

  /**
   * Prepare locale file imports
   */
  for (const locale of localeInfo) {
    locale?.meta?.forEach(meta => generateLocaleImports(locale.code, meta))
  }

  /**
   * Reverse order so project overwrites layers
   */
  const vueI18nConfigImports = vueI18nConfigPaths
    .reverse()
    .filter(config => config.absolute !== '')
    .map(config => generateVueI18nConfiguration(config))

  const localeMessages = localeInfo.map(locale => [locale.code, locale.meta?.map(meta => importMapper.get(meta.key))])

  const generatedNuxtI18nOptions = {
    ...nuxtI18nOptions,
    locales: simplifyLocaleOptions((nuxtI18nOptions?.locales ?? []) as unknown as LocaleObject[])
  }
  delete nuxtI18nOptions.vueI18n

  const generated = {
    importStrings,
    localeMessages,
    nuxtI18nOptions: generatedNuxtI18nOptions,
    vueI18nConfigs: vueI18nConfigImports
  }

  debug('generate code', generated)

  return generated
}

function genImportSpecifier(
  { loadPath, path, parsed, hash, type }: Pick<FileMeta, 'loadPath' | 'path' | 'parsed' | 'hash' | 'type'>,
  resourceType: PrerenderTarget['type'] | undefined,
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
