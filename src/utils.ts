import { promises as fs, constants as FS_CONSTANTS } from 'node:fs'
import { resolveFiles } from '@nuxt/kit'
import { parse as parsePath, resolve, relative } from 'pathe'
import { encodePath } from 'ufo'
import { resolveLockfile } from 'pkg-types'
import { isString } from '@intlify/shared'
import { NUXT_I18N_MODULE_ID } from './constants'

import type { LocaleObject } from 'vue-i18n-routing'
import type { NuxtI18nOptions, LocaleInfo } from './types'
import type { Nuxt } from '@nuxt/schema'

const PackageManagerLockFiles = {
  'npm-shrinkwrap.json': 'npm-legacy',
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm'
} as const

type LockFile = keyof typeof PackageManagerLockFiles
// prettier-ignore
type _PackageManager = typeof PackageManagerLockFiles[LockFile]
export type PackageManager = _PackageManager | 'unknown'

export async function getPackageManagerType(): Promise<PackageManager> {
  try {
    const parsed = parsePath(await resolveLockfile())
    const lockfile = `${parsed.name}${parsed.ext}` as LockFile
    if (lockfile == null) {
      return 'unknown'
    }
    const type = PackageManagerLockFiles[lockfile]
    return type == null ? 'unknown' : type
  } catch (e) {
    throw e
  }
}

export function formatMessage(message: string) {
  return `[${NUXT_I18N_MODULE_ID}]: ${message}`
}

export function getNormalizedLocales(locales: NuxtI18nOptions['locales']): LocaleObject[] {
  locales = locales || []
  const normalized: LocaleObject[] = []
  for (const locale of locales) {
    if (isString(locale)) {
      normalized.push({ code: locale, iso: locale })
    } else {
      normalized.push(locale)
    }
  }
  return normalized
}

export async function resolveLocales(path: string, locales: LocaleObject[]): Promise<LocaleInfo[]> {
  const files = await resolveFiles(path, '**/*{json,json5,yaml,yml,js,cjs,mjs,ts,cts,mts}')
  const find = (f: string) => files.find(file => file === resolve(path, f))
  return (locales as LocaleInfo[]).map(locale => {
    if (locale.file) {
      locale.path = find(locale.file)
    } else if (locale.files) {
      locale.paths = locale.files.map(file => find(file)).filter(Boolean) as string[]
    }
    return locale
  })
}

export function getLayerRootDirs(nuxt: Nuxt) {
  const layers = nuxt.options._layers
  return layers.length > 1 ? layers.map(layer => layer.config.rootDir) : []
}

export async function tryResolve(id: string, targets: string[], pkgMgr: PackageManager, extention = '') {
  for (const target of targets) {
    if (await isExists(target + extention)) {
      return target
    }
  }

  throw new Error(`Cannot resolve ${id} on ${pkgMgr}! please install it on 'node_modules'`)
}

export async function isExists(path: string) {
  try {
    await fs.access(path, FS_CONSTANTS.F_OK)
    return true
  } catch (e) {
    return false
  }
}

/**
 * sergment parser, forked from the below:
 * - original repository url: https://github.com/nuxt/framework
 * - code url: https://github.com/nuxt/framework/blob/main/packages/nuxt/src/pages/utils.ts
 * - author: Nuxt Framework Team
 * - license: MIT
 */

enum SegmentParserState {
  initial,
  static,
  dynamic,
  optional,
  catchall
}

enum SegmentTokenType {
  static,
  dynamic,
  optional,
  catchall
}

interface SegmentToken {
  type: SegmentTokenType
  value: string
}

const PARAM_CHAR_RE = /[\w\d_.]/

export function parseSegment(segment: string) {
  let state: SegmentParserState = SegmentParserState.initial
  let i = 0

  let buffer = ''
  const tokens: SegmentToken[] = []

  function consumeBuffer() {
    if (!buffer) {
      return
    }
    if (state === SegmentParserState.initial) {
      throw new Error('wrong state')
    }

    tokens.push({
      type:
        state === SegmentParserState.static
          ? SegmentTokenType.static
          : state === SegmentParserState.dynamic
          ? SegmentTokenType.dynamic
          : state === SegmentParserState.optional
          ? SegmentTokenType.optional
          : SegmentTokenType.catchall,
      value: buffer
    })

    buffer = ''
  }

  while (i < segment.length) {
    const c = segment[i]

    switch (state) {
      case SegmentParserState.initial:
        buffer = ''
        if (c === '[') {
          state = SegmentParserState.dynamic
        } else {
          i--
          state = SegmentParserState.static
        }
        break

      case SegmentParserState.static:
        if (c === '[') {
          consumeBuffer()
          state = SegmentParserState.dynamic
        } else {
          buffer += c
        }
        break

      case SegmentParserState.catchall:
      case SegmentParserState.dynamic:
      case SegmentParserState.optional:
        if (buffer === '...') {
          buffer = ''
          state = SegmentParserState.catchall
        }
        if (c === '[' && state === SegmentParserState.dynamic) {
          state = SegmentParserState.optional
        }
        if (c === ']' && (state !== SegmentParserState.optional || buffer[buffer.length - 1] === ']')) {
          if (!buffer) {
            throw new Error('Empty param')
          } else {
            consumeBuffer()
          }
          state = SegmentParserState.initial
        } else if (PARAM_CHAR_RE.test(c)) {
          buffer += c
        } else {
          // eslint-disable-next-line no-console
          // console.debug(`[pages]Ignored character "${c}" while building param "${buffer}" from "segment"`)
        }
        break
    }
    i++
  }

  if (state === SegmentParserState.dynamic) {
    throw new Error(`Unfinished param "${buffer}"`)
  }

  consumeBuffer()

  return tokens
}

export const resolveRelativeLocales = (
  relativeFileResolver: (files: string[]) => string[],
  locale: LocaleObject,
  merged: LocaleObject | undefined
) => {
  if (typeof locale === 'string') return merged

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { file, files, ...entry } = locale

  const fileEntries = getLocaleFiles(locale)
  const relativeFiles = relativeFileResolver(fileEntries)
  return {
    ...entry,
    ...merged,
    files: [...relativeFiles, ...(merged?.files ?? [])]
  }
}

export const getLocaleFiles = (locale: LocaleObject): string[] => {
  if (locale.file != null) return [locale.file]
  if (locale.files != null) return locale.files
  return []
}

export const localeFilesToRelative = (projectLangDir: string, layerLangDir: string, files: string[]) => {
  const absoluteFiles = files.map(file => resolve(layerLangDir, file))
  const relativeFiles = absoluteFiles.map(file => relative(projectLangDir, file))

  return relativeFiles
}

export const getProjectPath = (nuxt: Nuxt, ...target: string[]) => {
  const projectLayer = nuxt.options._layers[0]
  return resolve(projectLayer.config.rootDir, ...target)
}

export type LocaleConfig = {
  projectLangDir?: string | null
  langDir?: string | null
  locales?: (string | LocaleObject)[]
}
/**
 * Generically merge LocaleObject locales
 *
 * @param configs prepared configs to resolve locales relative to project
 * @param baseLocales optional array of locale objects to merge configs into
 */
export const mergeConfigLocales = (configs: LocaleConfig[], baseLocales: LocaleObject[] = []) => {
  const mergedLocales = new Map<string, LocaleObject>()
  baseLocales.forEach(locale => mergedLocales.set(locale.code, locale))

  for (const { locales, langDir, projectLangDir } of configs) {
    if (locales == null) continue
    if (langDir == null) continue
    if (projectLangDir == null) continue

    for (const locale of locales) {
      if (typeof locale === 'string') continue

      const filesResolver = (files: string[]) => localeFilesToRelative(projectLangDir, langDir, files)
      const resolvedLocale = resolveRelativeLocales(filesResolver, locale, mergedLocales.get(locale.code))
      if (resolvedLocale != null) mergedLocales.set(locale.code, resolvedLocale)
    }
  }

  return Array.from(mergedLocales.values())
}

/**
 * Merges project layer locales with registered i18n modules
 */
export const mergeI18nModules = async (options: NuxtI18nOptions, nuxt: Nuxt) => {
  const projectLayer = nuxt.options._layers[0]

  if (projectLayer.config.i18n) projectLayer.config.i18n.i18nModules = []
  const registerI18nModule = (config: Pick<NuxtI18nOptions, 'langDir' | 'locales'>) => {
    if (config.langDir == null) return
    projectLayer.config.i18n?.i18nModules?.push(config)
  }

  await nuxt.callHook('i18n:registerModule', registerI18nModule)
  const modules = projectLayer.config.i18n?.i18nModules ?? []
  const projectLangDir = getProjectPath(nuxt, projectLayer.config.i18n?.langDir ?? '')

  if (modules.length > 0) {
    const baseLocales: LocaleObject[] = []
    const layerLocales = projectLayer.config.i18n?.locales ?? []

    for (const locale of layerLocales) {
      if (typeof locale !== 'object') continue
      baseLocales.push({ ...locale, file: undefined, files: getLocaleFiles(locale) })
    }

    const mergedLocales = mergeConfigLocales(
      modules.map(x => ({ ...x, projectLangDir })),
      baseLocales
    )

    if (projectLayer.config.i18n) {
      options.locales = mergedLocales
      projectLayer.config.i18n.locales = mergedLocales
    }
  }
}

export function getRoutePath(tokens: SegmentToken[]): string {
  return tokens.reduce((path, token) => {
    // prettier-ignore
    return (
      path +
      (token.type === SegmentTokenType.optional
        ? `:${token.value}?`
        : token.type === SegmentTokenType.dynamic
          ? `:${token.value}`
          : token.type === SegmentTokenType.catchall
            ? `:${token.value}(.*)*`
            : encodePath(token.value))
    )
  }, '/')
}
