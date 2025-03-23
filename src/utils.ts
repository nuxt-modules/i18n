import { readFileSync, existsSync } from 'node:fs'
import { createHash, type BinaryLike } from 'node:crypto'
import { resolvePath, useNuxt } from '@nuxt/kit'
import { parse as parsePath, resolve, relative, join } from 'pathe'
import { defu } from 'defu'
import { isString, isArray } from '@intlify/shared'
import { NUXT_I18N_MODULE_ID, EXECUTABLE_EXTENSIONS, EXECUTABLE_EXT_RE } from './constants'
import { parseSync } from './utils/parse'

import type { NuxtI18nOptions, LocaleInfo, LocaleType, LocaleFile, LocaleObject } from './types'
import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { IdentifierName, Program } from 'oxc-parser'

export function formatMessage(message: string) {
  return `[${NUXT_I18N_MODULE_ID}]: ${message}`
}

export function normalizeIncludingLocales(locales?: string | string[]) {
  return (toArray(locales) ?? []).filter(isString)
}

export function filterLocales(options: Required<NuxtI18nOptions>, nuxt: Nuxt) {
  const project = getLayerI18n(nuxt.options._layers[0])
  const includingLocales = normalizeIncludingLocales(project?.bundle?.onlyLocales)

  if (!includingLocales.length) {
    return
  }

  options.locales = options.locales.filter(locale => {
    const code = isString(locale) ? locale : locale.code
    return includingLocales.includes(code)
  }) as string[] | LocaleObject[]
}

export function getNormalizedLocales(locales: NuxtI18nOptions['locales']): LocaleObject[] {
  locales = locales || []
  const normalized: LocaleObject[] = []
  for (const locale of locales) {
    if (isString(locale)) {
      normalized.push({ code: locale, language: locale })
    } else {
      normalized.push(locale)
    }
  }
  return normalized
}

export function resolveLocales(srcDir: string, locales: LocaleObject[], buildDir: string): LocaleInfo[] {
  const localesResolved: LocaleInfo[] = []
  for (const locale of locales) {
    const resolved: LocaleInfo = Object.assign({}, locale, { meta: [] })
    delete resolved.file
    delete resolved.files

    const files = getLocaleFiles(locale)
    for (const f of files) {
      const filePath = resolve(srcDir, f.path)
      const localeType = getLocaleType(filePath)

      const metaFile = {
        path: filePath,
        loadPath: relative(buildDir, filePath),
        type: localeType,
        hash: getHash(filePath),
        file: {
          path: f.path,
          cache: f.cache ?? localeType !== 'dynamic'
        }
      }

      resolved.meta!.push(metaFile)
    }

    localesResolved.push(resolved)
  }

  return localesResolved
}

function getLocaleType(path: string): LocaleType {
  const ext = parsePath(path).ext
  if (EXECUTABLE_EXT_RE.test(ext)) {
    const parsed = parseSync(path, readFileSync(path, 'utf-8'))
    const analyzed = scanProgram(parsed.program)
    if (analyzed === 'object') {
      return 'static'
    } else if (analyzed === 'function' || analyzed === 'arrow-function') {
      return 'dynamic'
    } else {
      return 'unknown'
    }
  } else {
    return 'static'
  }
}

function scanProgram(program: Program) {
  let ret: false | 'object' | 'function' | 'arrow-function' = false
  let variableDeclaration: IdentifierName | undefined

  for (const node of program.body) {
    if (node.type !== 'ExportDefaultDeclaration') continue

    if (node.declaration.type === 'ObjectExpression') {
      ret = 'object'
      break
    }

    if (node.declaration.type === 'Identifier') {
      variableDeclaration = node.declaration
      break
    }

    if (node.declaration.type === 'CallExpression' && node.declaration.callee.type === 'Identifier') {
      const [fnNode] = node.declaration.arguments
      if (fnNode.type === 'FunctionExpression') {
        ret = 'function'
        break
      }

      if (fnNode.type === 'ArrowFunctionExpression') {
        ret = 'arrow-function'
        break
      }
    }
  }

  if (variableDeclaration) {
    for (const node of program.body) {
      if (node.type !== 'VariableDeclaration') continue
      for (const decl of node.declarations) {
        if (decl.type !== 'VariableDeclarator') continue
        if (decl.init == null) continue
        if ('name' in decl.id === false || decl.id.name !== variableDeclaration.name) continue

        if (decl.init.type === 'ObjectExpression') {
          ret = 'object'
          break
        }

        if (decl.init.type === 'CallExpression' && decl.init.callee.type === 'Identifier') {
          const [fnNode] = decl.init.arguments
          if (fnNode.type === 'FunctionExpression') {
            ret = 'function'
            break
          }

          if (fnNode.type === 'ArrowFunctionExpression') {
            ret = 'arrow-function'
            break
          }
        }
      }
    }
  }

  return ret
}

export async function resolveVueI18nConfigInfo(
  rootDir: string,
  configPath: string = 'i18n.config',
  buildDir = useNuxt().options.buildDir
) {
  const relativeBase = relative(buildDir, rootDir)
  const absolutePath = await resolvePath(configPath, { cwd: rootDir, extensions: EXECUTABLE_EXTENSIONS })
  if (!existsSync(absolutePath)) return undefined

  return {
    rootDir,
    meta: {
      loadPath: join(relativeBase, relative(rootDir, absolutePath)), // relative
      path: absolutePath, // absolute
      hash: getHash(absolutePath),
      type: getLocaleType(absolutePath)
    }
  }
}

export type PrerenderTarget = {
  type: 'locale' | 'config'
  path: string
}

export const getLocalePaths = (locale: LocaleObject): string[] => {
  return getLocaleFiles(locale).map(x => x.path)
}

export const getLocaleFiles = (locale: LocaleObject): LocaleFile[] => {
  if (locale.file != null) {
    return [locale.file].map(x => (isString(x) ? { path: x, cache: undefined } : x))
  }

  if (locale.files != null) {
    return [...locale.files].map(x => (isString(x) ? { path: x, cache: undefined } : x))
  }

  return []
}

export function resolveRelativeLocales(locale: LocaleObject, config: LocaleConfig) {
  const fileEntries = getLocaleFiles(locale)

  return fileEntries.map(file => ({
    path: resolve(useNuxt().options.rootDir, resolve(config.langDir ?? '', file.path)),
    cache: file.cache
  })) as LocaleFile[]
}

export type LocaleConfig = {
  langDir?: string | null
  locales?: string[] | LocaleObject[]
}

/**
 * Generically merge LocaleObject locales
 *
 * @param configs prepared configs to resolve locales relative to project
 * @param baseLocales optional array of locale objects to merge configs into
 */
export const mergeConfigLocales = (configs: LocaleConfig[], baseLocales: LocaleObject[] = []) => {
  const mergedLocales = new Map<string, LocaleObject>()

  for (const locale of baseLocales) {
    mergedLocales.set(locale.code, locale)
  }

  for (const config of configs) {
    if (config.locales == null) continue

    for (const locale of config.locales) {
      const code = isString(locale) ? locale : locale.code
      const merged = mergedLocales.get(code)

      // set normalized locale or to existing entry
      if (typeof locale === 'string') {
        mergedLocales.set(code, merged ?? { language: code, code })
        continue
      }

      const resolvedFiles = resolveRelativeLocales(locale, config)
      delete locale.file

      // merge locale and files with existing entry
      if (merged != null) {
        merged.files ??= [] as LocaleFile[]
        // @ts-ignore
        merged.files.unshift(...resolvedFiles)
        mergedLocales.set(code, {
          ...locale,
          ...merged
        })
        continue
      }

      mergedLocales.set(code, { ...locale, files: resolvedFiles })
    }
  }

  return Array.from(mergedLocales.values())
}

/**
 * Merges project layer locales with registered i18n modules
 */
export const mergeI18nModules = async (options: NuxtI18nOptions, nuxt: Nuxt) => {
  if (options) options.i18nModules = []

  const registerI18nModule = (config: Pick<NuxtI18nOptions, 'langDir' | 'locales'>) => {
    if (config.langDir == null) return
    options?.i18nModules?.push(config)
  }

  await nuxt.callHook('i18n:registerModule', registerI18nModule)
  const modules = options?.i18nModules ?? []

  if (modules.length > 0) {
    const baseLocales: LocaleObject[] = []
    const layerLocales = options.locales ?? []

    for (const locale of layerLocales) {
      if (typeof locale !== 'object') continue
      baseLocales.push({ ...locale, file: undefined, files: getLocaleFiles(locale) })
    }

    const mergedLocales = mergeConfigLocales(modules, baseLocales)

    options.locales = mergedLocales
  }
}

function getHash(text: BinaryLike): string {
  return createHash('sha256').update(text).digest('hex').substring(0, 8)
}

export function getLayerI18n(configLayer: NuxtConfigLayer) {
  const layerInlineOptions = (configLayer.config.modules || []).find(
    (mod): mod is [string, NuxtI18nOptions] | undefined =>
      isArray(mod) &&
      typeof mod[0] === 'string' &&
      [NUXT_I18N_MODULE_ID, `${NUXT_I18N_MODULE_ID}-edge`].includes(mod[0])
  )?.[1]

  if (configLayer.config.i18n) {
    return defu(configLayer.config.i18n, layerInlineOptions)
  }

  return layerInlineOptions
}

export const applyOptionOverrides = (options: NuxtI18nOptions, nuxt: Nuxt) => {
  const project = nuxt.options._layers[0]
  const { overrides, ...mergedOptions } = options

  if (overrides) {
    delete options.overrides
    project.config.i18n = defu(overrides, project.config.i18n)
    Object.assign(options, defu(overrides, mergedOptions))
  }
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}
