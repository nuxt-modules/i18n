import { promises as fs, readFileSync as _readFileSync, constants as FS_CONSTANTS } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolvePath } from '@nuxt/kit'
import { parse as parsePath, resolve, relative } from 'pathe'
import { parse as _parseCode } from '@babel/parser'
import { encodePath } from 'ufo'
import { resolveLockfile } from 'pkg-types'
// @ts-ignore
import { transform as stripType } from '@mizchi/sucrase'
import { isString, isRegExp, isFunction, isArray, isObject } from '@intlify/shared'
import { NUXT_I18N_MODULE_ID, TS_EXTENSIONS, EXECUTABLE_EXTENSIONS, NULL_HASH } from './constants'

import type { LocaleObject } from 'vue-i18n-routing'
import type { NuxtI18nOptions, LocaleInfo, VueI18nConfigPathInfo, LocaleType } from './types'
import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { File } from '@babel/types'

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
  const files = await Promise.all(locales.flatMap(x => (x.file ? [x.file] : x.files ?? [])).map(x => resolve(path, x)))

  const find = (f: string) => files.find(file => file === resolve(path, f))
  return (locales as LocaleInfo[]).map(locale => {
    if (locale.file) {
      locale.path = find(locale.file)
      if (locale.path) {
        locale.hash = getHash(locale.path)
        locale.type = getLocaleType(locale.path)
      }
    } else if (locale.files) {
      locale.paths = locale.files.map(file => find(file)).filter(Boolean) as string[]
      if (locale.paths) {
        locale.hashes = locale.paths.map(path => getHash(path))
        locale.types = locale.paths.map(path => getLocaleType(path))
      }
    }
    return locale
  })
}

function getLocaleType(path: string): LocaleType {
  const ext = parsePath(path).ext
  if (EXECUTABLE_EXTENSIONS.includes(ext)) {
    const code = readCode(path, ext)
    const parsed = parseCode(code, path)
    const anaylzed = scanProgram(parsed.program)
    if (anaylzed === 'object') {
      return 'static'
    } else if (anaylzed === 'function' || anaylzed === 'arrow-function') {
      return 'dynamic'
    } else {
      return 'unknown'
    }
  } else {
    return 'static'
  }
}

const PARSE_CODE_CACHES = new Map<string, ReturnType<typeof _parseCode>>()

function parseCode(code: string, path: string) {
  if (PARSE_CODE_CACHES.has(path)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return PARSE_CODE_CACHES.get(path)!
  }

  const parsed = _parseCode(code, {
    allowImportExportEverywhere: true,
    sourceType: 'module'
  })

  PARSE_CODE_CACHES.set(path, parsed)
  return parsed
}

function scanProgram(program: File['program'] /*, calleeName: string*/) {
  let ret: false | 'object' | 'function' | 'arrow-function' = false
  for (const node of program.body) {
    if (node.type === 'ExportDefaultDeclaration') {
      if (node.declaration.type === 'ObjectExpression') {
        ret = 'object'
        break
      } else if (
        node.declaration.type === 'CallExpression' &&
        node.declaration.callee.type === 'Identifier' // &&
        // node.declaration.callee.name === calleeName
      ) {
        const [fnNode] = node.declaration.arguments
        if (fnNode.type === 'FunctionExpression') {
          ret = 'function'
          break
        } else if (fnNode.type === 'ArrowFunctionExpression') {
          ret = 'arrow-function'
          break
        }
      }
    }
  }
  return ret
}

export function readCode(absolutePath: string, ext: string) {
  let code = readFileSync(absolutePath)
  if (TS_EXTENSIONS.includes(ext)) {
    const out = stripType(code, {
      transforms: ['jsx'],
      keepUnusedImports: true
    })
    code = out.code
  }
  return code
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

export async function writeFile(path: string, data: string) {
  await fs.writeFile(path, data, { encoding: 'utf-8' })
}

export async function readFile(path: string) {
  return await fs.readFile(path, { encoding: 'utf-8' })
}

export function readFileSync(path: string) {
  return _readFileSync(path, { encoding: 'utf-8' })
}

export async function isExists(path: string) {
  try {
    await fs.access(path, FS_CONSTANTS.F_OK)
    return true
  } catch (e) {
    return false
  }
}

export async function resolveVueI18nConfigInfo(options: NuxtI18nOptions, buildDir: string, rootDir: string) {
  const configPathInfo: VueI18nConfigPathInfo = {
    relativeBase: relative(buildDir, rootDir),
    rootDir,
    hash: NULL_HASH
  }

  const vueI18nConfigRelativePath = (configPathInfo.relative = options.vueI18n || 'i18n.config')
  const vueI18nConfigAbsolutePath = await resolvePath(vueI18nConfigRelativePath, {
    cwd: rootDir,
    extensions: EXECUTABLE_EXTENSIONS
  })
  if (await isExists(vueI18nConfigAbsolutePath)) {
    configPathInfo.absolute = vueI18nConfigAbsolutePath
    configPathInfo.hash = getHash(vueI18nConfigAbsolutePath)
    configPathInfo.type = getLocaleType(vueI18nConfigAbsolutePath)
  }

  return configPathInfo
}

export type PrerenderTarget = {
  type: 'locale' | 'config'
  path: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toCode(code: any): string {
  if (code === null) {
    return `null`
  }

  if (code === undefined) {
    return `undefined`
  }

  if (isString(code)) {
    return JSON.stringify(code)
  }

  if (isRegExp(code) && code.toString) {
    return code.toString()
  }

  if (isFunction(code) && code.toString) {
    return `(${code.toString().replace(new RegExp(`^${code.name}`), 'function ')})`
  }

  if (isArray(code)) {
    return `[${code.map(c => toCode(c)).join(`,`)}]`
  }

  if (isObject(code)) {
    return stringifyObj(code)
  }

  return code + ``
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringifyObj(obj: Record<string, any>): string {
  return `Object({${Object.entries(obj)
    .map(([key, value]) => `${JSON.stringify(key)}:${toCode(value)}`)
    .join(`,`)}})`
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
  const projectI18n = getLayerI18n(projectLayer)
  if (options) options.i18nModules = []

  const registerI18nModule = (config: Pick<NuxtI18nOptions, 'langDir' | 'locales'>) => {
    if (config.langDir == null) return
    options?.i18nModules?.push(config)
  }

  await nuxt.callHook('i18n:registerModule', registerI18nModule)
  const modules = options?.i18nModules ?? []
  const projectLangDir = getProjectPath(nuxt, projectI18n?.langDir ?? '')

  if (modules.length > 0) {
    const baseLocales: LocaleObject[] = []
    const layerLocales = options.locales ?? []

    for (const locale of layerLocales) {
      if (typeof locale !== 'object') continue
      baseLocales.push({ ...locale, file: undefined, files: getLocaleFiles(locale) })
    }

    const mergedLocales = mergeConfigLocales(
      modules.map(x => ({ ...x, projectLangDir })),
      baseLocales
    )

    options.locales = mergedLocales
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

export function getHash(text: Buffer | string): string {
  return createHash('sha256').update(text).digest('hex').substring(0, 8)
}

export function getLayerI18n(configLayer: NuxtConfigLayer) {
  const layerInlineOptions = (configLayer.config.modules || []).find(
    (mod): mod is [string, NuxtI18nOptions] | undefined => isArray(mod) && mod[0] === NUXT_I18N_MODULE_ID
  )?.[1]

  if (configLayer.config.i18n) {
    return { ...layerInlineOptions, ...configLayer.config.i18n }
  }

  return layerInlineOptions
}
