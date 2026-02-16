import { defu } from 'defu'
import { readFileSync } from 'node:fs'
import { type BinaryLike, createHash } from 'node:crypto'
import { useLogger } from '@nuxt/kit'
import { resolve } from 'pathe'
import { assign, isArray, isString } from '@intlify/shared'
import { EXECUTABLE_EXT_RE } from './constants'
import { parseSync } from 'oxc-parser'

import type { LocaleFile, LocaleInfo, LocaleObject, LocaleType, NuxtI18nOptions } from './types'
import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { IdentifierName, Program, VariableDeclarator } from 'oxc-parser'
import type { I18nNuxtContext } from './context'

export function filterLocales(ctx: I18nNuxtContext, nuxt: Nuxt) {
  const project = getLayerI18n(nuxt.options._layers[0]!)
  const include = toArray(project?.bundle?.onlyLocales ?? []).filter(isString)

  if (!include.length) {
    return ctx.options.locales
  }

  return ctx.options.locales.filter(x => include.includes(isString(x) ? x : x.code)) as string[] | LocaleObject[]
}

export function resolveLocales(srcDir: string, locales: LocaleObject[], vfs: Record<string, string>): LocaleInfo[] {
  const localesResolved: LocaleInfo[] = []
  for (const locale of locales) {
    const resolved: LocaleInfo = assign({ meta: [] }, locale)
    delete resolved.file
    delete resolved.files

    for (const f of getLocaleFiles(locale)) {
      const path = resolve(srcDir, f.path)
      const type = getLocaleType(path, vfs)

      resolved.meta.push({
        type,
        path,
        hash: getHash(path),
        cache: f.cache ?? type !== 'dynamic',
      })
    }

    localesResolved.push(resolved)
  }

  return localesResolved
}

const analyzedMap = { object: 'static', function: 'dynamic', unknown: 'unknown' } as const
function getLocaleType(path: string, vfs: Record<string, string>): LocaleType {
  if (!EXECUTABLE_EXT_RE.test(path)) { return 'static' }

  const parsed = parseSync(path, vfs[path] ?? readFileSync(path, 'utf-8'))
  return analyzedMap[scanProgram(parsed.program) || 'unknown']
}

function scanProgram(program: Program) {
  let varDeclarationName: IdentifierName | undefined
  const varDeclarations: VariableDeclarator[] = []

  for (const node of program.body) {
    switch (node.type) {
      // collect variable declarations
      case 'VariableDeclaration':
        for (const decl of node.declarations) {
          if (decl.type !== 'VariableDeclarator' || decl.init == null) { continue }
          if ('name' in decl.id === false) { continue }
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
          if (fnNode?.type === 'FunctionExpression' || fnNode?.type === 'ArrowFunctionExpression') {
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
        if (fnNode?.type === 'FunctionExpression' || fnNode?.type === 'ArrowFunctionExpression') {
          return 'function'
        }
      }
    }
  }

  return false
}

export function resolveVueI18nConfigInfo(path: string, vfs: Record<string, string>) {
  return {
    path,
    hash: getHash(path),
    type: getLocaleType(path, vfs),
  }
}

export const getLocaleFiles = (locale: LocaleObject): LocaleFile[] => {
  return toArray(locale.file ?? locale.files)
    .filter(x => x != null)
    .map(x => (isString(x) ? { path: x, cache: undefined } : x))
}

export function resolveRelativeLocales(locale: LocaleObject, config: LocaleConfig) {
  return getLocaleFiles(locale).map(file => ({
    path: resolve(config.langDir, file.path),
    cache: file.cache,
  })) as LocaleFile[]
}

export type LocaleConfig<T = string[] | LocaleObject[]> = { langDir: string, locales: T }

/**
 * Generically merge LocaleObject locales
 *
 * @param configs prepared configs to resolve locales relative to project
 */
export const mergeConfigLocales = (configs: LocaleConfig[]) => {
  const merged: Map<string, LocaleObject> = new Map()
  for (const config of configs) {
    for (const locale of config.locales ?? []) {
      const current: LocaleObject = isString(locale) ? { code: locale, language: locale } : assign({}, locale)

      const files = isString(locale) ? [] : resolveRelativeLocales(current, config)
      delete current.file
      delete current.files

      const existing = merged.get(current.code) ?? {
        code: current.code,
        language: current.language,
        files: [] as LocaleFile[],
      }

      existing.files = [...files, ...(existing.files as LocaleFile[])]

      merged.set(current.code, assign({}, current, existing))
    }
  }

  return Array.from(merged.values())
}

function getHash(text: BinaryLike): string {
  return createHash('sha256').update(text).digest('hex').substring(0, 8)
}

export function getLayerI18n(configLayer: NuxtConfigLayer) {
  const layerInlineOptions = (configLayer.config.modules || []).find(
    (mod): mod is [string, NuxtI18nOptions] | undefined => isArray(mod) && '@nuxtjs/i18n' === mod[0])?.[1]

  if (configLayer.config.i18n) {
    return defu(configLayer.config.i18n, layerInlineOptions)
  }

  return layerInlineOptions
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

export const logger = useLogger('nuxt-i18n')
