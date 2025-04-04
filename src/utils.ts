import { readFileSync, existsSync } from 'node:fs'
import { createHash, type BinaryLike } from 'node:crypto'
import { resolvePath, useNuxt } from '@nuxt/kit'
import { resolve, relative, join } from 'pathe'
import { defu } from 'defu'
import { isString, isArray, assign, isObject } from '@intlify/shared'
import { NUXT_I18N_MODULE_ID, EXECUTABLE_EXTENSIONS, EXECUTABLE_EXT_RE } from './constants'
import { parseSync } from './utils/parse'

import type { NuxtI18nOptions, LocaleInfo, LocaleType, LocaleFile, LocaleObject } from './types'
import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { IdentifierName, Program, VariableDeclarator } from 'oxc-parser'

export function formatMessage(message: string) {
  return `[${NUXT_I18N_MODULE_ID}]: ${message}`
}

export function filterLocales(options: Required<NuxtI18nOptions>, nuxt: Nuxt) {
  const project = getLayerI18n(nuxt.options._layers[0])
  const includingLocales = toArray(project?.bundle?.onlyLocales ?? []).filter(isString)

  if (!includingLocales.length) {
    return
  }

  options.locales = options.locales.filter(locale =>
    includingLocales.includes(isString(locale) ? locale : locale.code)
  ) as string[] | LocaleObject[]
}

export function getNormalizedLocales(locales: NuxtI18nOptions['locales'] = []): LocaleObject[] {
  const normalized: LocaleObject[] = []
  for (const locale of locales) {
    normalized.push(isString(locale) ? { code: locale, language: locale } : locale)
  }
  return normalized
}

export function resolveLocales(srcDir: string, locales: LocaleObject[], buildDir: string): LocaleInfo[] {
  const localesResolved: LocaleInfo[] = []
  for (const locale of locales) {
    const resolved: LocaleInfo = assign({ meta: [] }, locale)
    delete resolved.file
    delete resolved.files

    const files = getLocaleFiles(locale)
    for (const f of files) {
      const path = resolve(srcDir, f.path)
      const type = getLocaleType(path)

      resolved.meta.push({
        type,
        path,
        hash: getHash(path),
        loadPath: relative(buildDir, path),
        file: {
          path: f.path,
          cache: f.cache ?? type !== 'dynamic'
        }
      })
    }

    localesResolved.push(resolved)
  }

  return localesResolved
}

function getLocaleType(path: string): LocaleType {
  if (!EXECUTABLE_EXT_RE.test(path)) {
    return 'static'
  }

  const parsed = parseSync(path, readFileSync(path, 'utf-8'))
  const analyzed = scanProgram(parsed.program)
  // prettier-ignore
  return analyzed === 'object'
    ? 'static'
    : analyzed === 'function'
      ? 'dynamic'
      : 'unknown'
}

function scanProgram(program: Program) {
  let varDeclarationName: IdentifierName | undefined
  const varDeclarations: VariableDeclarator[] = []

  for (const node of program.body) {
    switch (node.type) {
      // collect variable declarations
      case 'VariableDeclaration':
        for (const decl of node.declarations) {
          if (decl.type !== 'VariableDeclarator' || decl.init == null) continue
          if ('name' in decl.id === false) continue
          varDeclarations.push(decl)
        }
        break
      // check default export - store identifier if exporting variable name
      case 'ExportDefaultDeclaration':
        if (node.declaration.type === 'Identifier') {
          varDeclarationName = node.declaration
          break
        }

        if (node.declaration.type === 'ObjectExpression') {
          return 'object'
        }

        if (node.declaration.type === 'CallExpression' && node.declaration.callee.type === 'Identifier') {
          const [fnNode] = node.declaration.arguments
          if (fnNode.type === 'FunctionExpression' || fnNode.type === 'ArrowFunctionExpression') {
            return 'function'
          }
        }
        break
    }
  }

  if (varDeclarationName) {
    const n = varDeclarations.find(x => x.id.type === 'Identifier' && x.id.name === varDeclarationName.name)
    if (n) {
      if (n.init?.type === 'ObjectExpression') {
        return 'object'
      }

      if (n.init?.type === 'CallExpression' && n.init.callee.type === 'Identifier') {
        const [fnNode] = n.init.arguments
        if (fnNode.type === 'FunctionExpression' || fnNode.type === 'ArrowFunctionExpression') {
          return 'function'
        }
      }
    }
  }

  return false
}

export async function resolveVueI18nConfigInfo(
  rootDir: string,
  configPath: string = 'i18n.config',
  buildDir = useNuxt().options.buildDir
) {
  const absolutePath = await resolvePath(configPath, { cwd: rootDir, extensions: EXECUTABLE_EXTENSIONS })
  if (!existsSync(absolutePath)) return undefined

  const relativeBase = relative(buildDir, rootDir)
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

export const getLocaleFiles = (locale: LocaleObject): LocaleFile[] => {
  return toArray(locale.file ?? locale.files)
    .filter(x => x != null)
    .map(x => (isString(x) ? { path: x, cache: undefined } : x))
}

export function resolveRelativeLocales(locale: LocaleObject, config: LocaleConfig) {
  const rootDir = useNuxt().options.rootDir
  return getLocaleFiles(locale).map(file => ({
    path: resolve(rootDir, resolve(config.langDir ?? '', file.path)),
    cache: file.cache
  })) as LocaleFile[]
}

export type LocaleConfig = {
  langDir: string
  locales: string[] | LocaleObject[]
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
    for (const locale of config.locales ?? []) {
      // set normalized locale or keep existing entry
      if (isString(locale)) {
        mergedLocales.set(locale, mergedLocales.get(locale) ?? { language: locale, code: locale })
        continue
      }

      const files = resolveRelativeLocales(locale, config)
      delete locale.file

      // merge locale and files with existing entry
      const merged = mergedLocales.get(locale.code)
      if (merged != null) {
        merged.files ??= [] as LocaleFile[]
        // @ts-ignore
        merged.files.unshift(...files)
        mergedLocales.set(locale.code, assign({}, locale, merged))
        continue
      }

      mergedLocales.set(locale.code, assign({}, locale, { files }))
    }
  }

  return Array.from(mergedLocales.values())
}

/**
 * Merges project layer locales with registered i18n modules
 */
export const mergeI18nModules = async (options: NuxtI18nOptions, nuxt: Nuxt) => {
  const i18nModules: LocaleConfig[] = []

  await nuxt.callHook(
    'i18n:registerModule',
    config => config.langDir && config.locales && i18nModules.push({ langDir: config.langDir, locales: config.locales })
  )

  if (i18nModules.length > 0) {
    const baseLocales: LocaleObject[] = []
    for (const locale of options.locales!) {
      if (!isObject(locale)) continue
      baseLocales.push(assign({}, locale, { file: undefined, files: getLocaleFiles(locale) }))
    }
    options.locales = mergeConfigLocales(i18nModules, baseLocales)
  }
  options.i18nModules = i18nModules
}

function getHash(text: BinaryLike): string {
  return createHash('sha256').update(text).digest('hex').substring(0, 8)
}

export function getLayerI18n(configLayer: NuxtConfigLayer) {
  const layerInlineOptions = (configLayer.config.modules || []).find(
    (mod): mod is [string, NuxtI18nOptions] | undefined =>
      isArray(mod) && isString(mod[0]) && [NUXT_I18N_MODULE_ID, `${NUXT_I18N_MODULE_ID}-edge`].includes(mod[0])
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
    assign(options, defu(overrides, mergedOptions))
  }
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}
