import { defu } from 'defu'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { useLogger } from '@nuxt/kit'
import { resolve } from 'pathe'
import { assign, isArray, isString } from '@intlify/shared'
import { EXECUTABLE_EXT_RE } from './constants'
import { parseSync } from 'oxc-parser'

import type {
  FileMeta,
  LocaleFile,
  LocaleInfo,
  LocaleObject,
  LocaleType,
  NormalizedLocaleObject,
  NuxtI18nOptions,
} from './types'
import type { NuxtConfigLayer } from '@nuxt/schema'
import type { Node, ObjectExpression, Program, Statement } from 'oxc-parser'
import type { I18nNuxtContext } from './context'

export function filterLocales(ctx: I18nNuxtContext) {
  // use `onlyLocales` from the first layer that specifies it
  const onlyLocales = ctx.i18nLayers.map(layer => layer.i18n.bundle?.onlyLocales).find(x => x != null)
  const include = toArray(onlyLocales ?? []).filter(isString)

  if (!include.length) {
    return ctx.options.locales
  }

  return ctx.options.locales.filter(x => include.includes(isString(x) ? x : x.code)) as string[] | LocaleObject[]
}

// locale codes are used as single URL path segments (route prefixes, messages endpoint), in route names and in cookies (#4036)
const INVALID_LOCALE_CODE_CHAR_RE = /[/\\?#%:\s]/

export function validateLocaleCodes(codes: string[]) {
  const invalid = codes.filter(code => !code || INVALID_LOCALE_CODE_CHAR_RE.test(code))
  if (invalid.length) {
    throw new Error(
      `[nuxt-i18n] Invalid locale code${invalid.length > 1 ? 's' : ''}: ${invalid.map(x => JSON.stringify(x)).join(', ')}. `
      + 'Locale codes are used as URL path segments and must not be empty or contain `/ \\ ? # % :` or whitespace.',
    )
  }
}

/**
 * Resolves the single-domain fields (`domain`/`domainDefault`) into their multi-domain forms
 * (`domains`/`defaultForDomains`) so domain logic only handles one shape. Both are always set,
 * which is what {@link NormalizedLocaleObject} narrows for. The scalar fields stay on the value
 * for user code reading `locales`.
 */
export function normalizeDomainLocale<T extends string>(locale: LocaleObject<T>): NormalizedLocaleObject<T> {
  const domains = locale.domains?.length ? locale.domains : locale.domain ? [locale.domain] : []
  return assign({}, locale, {
    domains,
    defaultForDomains: locale.defaultForDomains ?? (locale.domainDefault ? domains : []),
  }) as NormalizedLocaleObject<T>
}

export function resolveLocales(srcDir: string, locales: LocaleObject[], vfs: Record<string, string>): LocaleInfo[] {
  const localesResolved: LocaleInfo[] = []
  for (const locale of locales) {
    const resolved: LocaleInfo = assign({ meta: [] }, locale)
    delete resolved.file
    delete resolved.files

    for (const f of getLocaleFiles(locale)) {
      const path = resolve(srcDir, f.path)
      const { type, serializable } = analyzeResource(path, vfs)

      resolved.meta.push({
        type,
        serializable,
        path,
        hash: getHash(path),
        cache: f.cache ?? type !== 'dynamic',
      })
    }

    localesResolved.push(resolved)
  }

  return localesResolved
}

/**
 * Classifies a message source: whether the build can resolve its messages, and whether those
 * messages survive the JSON messages endpoint - message functions do not, and are dropped
 * without a trace (#3880).
 */
function analyzeResource(path: string, vfs: Record<string, string>) {
  if (!EXECUTABLE_EXT_RE.test(path)) { return { type: 'static' as LocaleType, serializable: true } }

  const scope = collectDeclarations(parseSync(path, vfs[path] ?? readFileSync(path, 'utf-8')).program)
  const exported = resolveDefaultExport(scope)
  const type = localeTypeOf(exported, scope)
  const visible = visibleMessages(exported, scope)

  return {
    type,
    // an unreadable shape is assumed to hold message functions, so the locale keeps its loaders
    // instead of losing them to JSON (#3880) - a loader body stays optimistic, what it fetches
    // never carried functions to begin with
    serializable: type === 'unknown' && visible.length === 0
      ? false
      : !visible.some(x => holds(x, scope, isMessageFunction)),
  }
}

// `() => ({ ... })` parses with an explicit `ParenthesizedExpression` node, and TS assertions
// (`as` / `satisfies` / `!`) nest the runtime expression the same way
function unwrap(node?: Node | null): Node | undefined {
  switch (node?.type) {
    case 'ParenthesizedExpression':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
      return unwrap(node.expression)
    case 'AwaitExpression':
      return unwrap(node.argument)
    case 'SequenceExpression':
      return unwrap(node.expressions.at(-1))
  }
  return node ?? undefined
}

type Scope = { declared: Map<string, Node>, exported?: Node }

/** Module-scope `const`/`let` initialisers, whether or not the declaration is itself exported */
function collectDeclarations(program: Program): Scope {
  const scope: Scope = { declared: new Map() }

  for (const node of program.body) {
    if (node.type === 'ExportDefaultDeclaration') {
      scope.exported = node.declaration
      continue
    }
    // `export const messages = {...}` nests the declaration one level deeper
    declare(scope, node.type === 'ExportNamedDeclaration' ? node.declaration : node)
  }

  return scope
}

/** The expression a node evaluates to, following variable hops until a non-identifier is reached */
function deref(node: Node | null | undefined, scope: Scope, seen = new Set<string>()): Node | undefined {
  const resolved = unwrap(node)
  if (resolved?.type !== 'Identifier') { return resolved }
  // an identifier declared outside this module, or one that resolves back to itself, is unreadable
  if (seen.has(resolved.name)) { return undefined }
  seen.add(resolved.name)
  return deref(scope.declared.get(resolved.name), scope, seen)
}

const resolveDefaultExport = (scope: Scope) => deref(scope.exported, scope)

/** The function a `defineI18nLocale(fn)` wraps - the callee is not checked by name */
function loaderFunction(node: Node | undefined, scope: Scope) {
  if (node?.type !== 'CallExpression' || node.callee.type !== 'Identifier') { return }
  const fnNode = deref(node.arguments[0], scope)
  if (fnNode?.type === 'FunctionExpression' || fnNode?.type === 'ArrowFunctionExpression') { return fnNode }
}

function localeTypeOf(exported: Node | undefined, scope: Scope): LocaleType {
  if (exported?.type === 'ObjectExpression') {
    // a computed key is not readable here, and the bundler's resource transform cannot parse one
    // either - such a file has to stay a module rather than be treated as a static resource (#3961)
    return holds(exported, scope, isComputedKey) ? 'unknown' : 'static'
  }
  return loaderFunction(exported, scope) ? 'dynamic' : 'unknown'
}

/** Every statement in reach of a function body - nested functions keep their own */
function* statementsOf(statement: Statement): Generator<Statement> {
  yield statement
  switch (statement.type) {
    case 'BlockStatement':
      for (const s of statement.body) { yield* statementsOf(s) }
      return
    case 'IfStatement':
      yield* statementsOf(statement.consequent)
      if (statement.alternate) { yield* statementsOf(statement.alternate) }
      return
    case 'TryStatement':
      yield* statementsOf(statement.block)
      if (statement.handler) { yield* statementsOf(statement.handler.body) }
      if (statement.finalizer) { yield* statementsOf(statement.finalizer) }
      return
    case 'SwitchStatement':
      for (const c of statement.cases) {
        for (const s of c.consequent) { yield* statementsOf(s) }
      }
      return
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'LabeledStatement':
      yield* statementsOf(statement.body)
  }
}

function declare(scope: Scope, declaration: Statement | null | undefined) {
  if (declaration?.type !== 'VariableDeclaration') { return }
  for (const decl of declaration.declarations) {
    if (decl.type !== 'VariableDeclarator' || decl.init == null) { continue }
    if ('name' in decl.id === false) { continue }
    scope.declared.set(decl.id.name, decl.init)
  }
}

/** Every object an expression can evaluate to - a branch contributes one per side */
function* objectsOf(node: Node | null | undefined, scope: Scope, seen: Set<Node>): Generator<ObjectExpression> {
  const resolved = deref(node, scope)
  if (resolved == null || seen.has(resolved)) { return }
  seen.add(resolved)

  switch (resolved.type) {
    case 'ObjectExpression':
      yield resolved
      return
    case 'ConditionalExpression':
      yield* objectsOf(resolved.consequent, scope, seen)
      yield* objectsOf(resolved.alternate, scope, seen)
      return
    case 'LogicalExpression':
      yield* objectsOf(resolved.left, scope, seen)
      yield* objectsOf(resolved.right, scope, seen)
  }
}

/** The message objects the build can read - a loader body may return one per branch */
function visibleMessages(exported: Node | undefined, scope: Scope): ObjectExpression[] {
  if (exported?.type === 'ObjectExpression') { return [exported] }

  const body = deref(loaderFunction(exported, scope)?.body, scope)
  if (body?.type !== 'BlockStatement') { return [...objectsOf(body, scope, new Set())] }

  // a returned variable is usually built in the body, so those declarations resolve too
  const statements = [...statementsOf(body)]
  const local: Scope = { declared: new Map(scope.declared) }
  for (const statement of statements) { declare(local, statement) }

  const objects: ObjectExpression[] = []
  for (const statement of statements) {
    if (statement.type === 'ReturnStatement') { objects.push(...objectsOf(statement.argument, local, new Set())) }
  }
  return objects
}

/**
 * Whether any node in a message tree satisfies `test`, following spreads and variable hops. Values
 * that are not object or array literals are left to `test` - the build cannot see into them.
 */
function holds(node: Node | null | undefined, scope: Scope, test: (node: Node) => boolean, seen = new Set<Node>()): boolean {
  const resolved = deref(node, scope)
  if (resolved == null || seen.has(resolved)) { return false }
  seen.add(resolved)
  if (test(resolved)) { return true }

  switch (resolved.type) {
    case 'ObjectExpression':
      return resolved.properties.some(x =>
        holds(x.type === 'SpreadElement' ? x.argument : x.value, scope, test, seen))
    case 'ArrayExpression':
      return resolved.elements.some(x =>
        x != null && holds(x.type === 'SpreadElement' ? x.argument : x, scope, test, seen))
  }
  return false
}

// only functions are unserializable - any other expression evaluates to a value JSON can carry
const isMessageFunction = (node: Node) =>
  node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression'

const isComputedKey = (node: Node) =>
  node.type === 'ObjectExpression' && node.properties.some(x => x.type === 'Property' && x.computed)

export function resolveVueI18nConfigInfo(path: string, vfs: Record<string, string>) {
  return { path, hash: getHash(path), ...analyzeResource(path, vfs) }
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

function getHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').substring(0, 8)
}

/**
 * Compute a content-based hash for cache-busting message server routes.
 * Why: vue-i18n config files run at runtime and may declare `fallbackLocale`,
 * so we can't statically resolve fallback chains. To stay correct under
 * fallbacks, every locale shares one hash covering all locale + config
 * files — any content change busts every endpoint.
 */
export function computeLocaleHashes(localeInfo: LocaleInfo[], vueI18nConfigPaths: Omit<FileMeta, 'cache'>[]): Record<string, string> {
  const hasher = createHash('sha256')
  const paths = [
    ...localeInfo.flatMap(l => l.meta.map(m => m.path)),
    ...vueI18nConfigPaths.map(c => c.path),
  ].sort()

  for (const p of paths) {
    hasher.update(readFileSync(p))
  }

  const digest = hasher.digest('hex').substring(0, 8)
  const hashes: Record<string, string> = {}
  for (const locale of localeInfo) {
    hashes[locale.code] = digest
  }

  return hashes
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
