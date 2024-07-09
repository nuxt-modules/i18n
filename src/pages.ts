import createDebug from 'debug'
import { extendPages } from '@nuxt/kit'
import { isString } from '@intlify/shared'
import { parse as parseSFC, compileScript } from '@vue/compiler-sfc'
import { walk } from 'estree-walker'
import MagicString from 'magic-string'
import { formatMessage, getRoutePath, parseSegment, readFileSync } from './utils'
import { localizeRoutes } from './routing'
import { mergeLayerPages } from './layers'
import { resolve, parse as parsePath } from 'pathe'
import { NUXT_I18N_COMPOSABLE_DEFINE_ROUTE } from './constants'

import type { Nuxt, NuxtPage } from '@nuxt/schema'
import type { NuxtI18nOptions, CustomRoutePages, ComputedRouteOptions, RouteOptionsResolver } from './types'
import type { Node, ObjectExpression, ArrayExpression } from '@babel/types'

const debug = createDebug('@nuxtjs/i18n:pages')

export type AnalyzedNuxtPageMeta = {
  inRoot: boolean
  /**
   * Analyzed path used to retrieve configured custom paths
   */
  path: string
}

export type NuxtPageAnalyzeContext = {
  /**
   * Array of paths to track current route depth
   */
  stack: string[]
  srcDir: string
  pagesDir: string
  pages: Map<NuxtPage, AnalyzedNuxtPageMeta>
}

export function setupPages(options: Required<NuxtI18nOptions>, nuxt: Nuxt) {
  let includeUnprefixedFallback = nuxt.options.ssr === false
  nuxt.hook('nitro:init', () => {
    debug('enable includeUprefixedFallback')
    includeUnprefixedFallback = options.strategy !== 'prefix'
  })

  const pagesDir = nuxt.options.dir && nuxt.options.dir.pages ? nuxt.options.dir.pages : 'pages'
  const srcDir = nuxt.options.srcDir
  debug(`pagesDir: ${pagesDir}, srcDir: ${srcDir}, trailingSlash: ${options.trailingSlash}`)

  extendPages(pages => {
    debug('pages making ...', pages)
    const ctx: NuxtPageAnalyzeContext = {
      stack: [],
      srcDir,
      pagesDir,
      pages: new Map<NuxtPage, AnalyzedNuxtPageMeta>()
    }

    analyzeNuxtPages(ctx, pages)
    const analyzer = (pageDirOverride: string) => analyzeNuxtPages(ctx, pages, pageDirOverride)
    mergeLayerPages(analyzer, nuxt)

    const localizedPages = localizeRoutes(pages, {
      ...options,
      includeUnprefixedFallback,
      optionsResolver: getRouteOptionsResolver(ctx, options)
    })

    // keep root when using prefixed routing without prerendering
    const indexPage = pages.find(x => x.path === '/')
    if (!nuxt.options._generate && options.strategy === 'prefix' && indexPage != null) {
      localizedPages.unshift(indexPage)
    }

    pages.splice(0, pages.length)
    pages.unshift(...localizedPages)
    debug('... made pages', pages)
  })
}

/**
 * Analyze page path
 */
function analyzePagePath(pagePath: string, parents = 0) {
  const { dir, name } = parsePath(pagePath)

  if (parents > 0 || dir !== '/') {
    return `${dir.slice(1, dir.length)}/${name}`
  }

  return name
}

/**
 * Construct the map of full paths from NuxtPage to support custom routes.
 * `NuxtPage` of the nested route doesn't have a slash (`/`) and isn’t the full path.
 */
export function analyzeNuxtPages(ctx: NuxtPageAnalyzeContext, pages?: NuxtPage[], pageDirOverride?: string): void {
  if (pages == null || pages.length === 0) return

  const pagesPath = resolve(ctx.srcDir, pageDirOverride ?? ctx.pagesDir)
  for (const page of pages) {
    if (page.file == null) continue

    const splits = page.file.split(pagesPath)
    const filePath = splits.at(1)
    if (filePath == null) continue

    ctx.pages.set(page, {
      path: analyzePagePath(filePath, ctx.stack.length),
      inRoot: ctx.stack.length === 0
    })

    ctx.stack.push(page.path)
    analyzeNuxtPages(ctx, page.children, pageDirOverride)
    ctx.stack.pop()
  }
}

/**
 * Function factory, returns a function based on the `customRoutes` option property
 */
export function getRouteOptionsResolver(
  ctx: NuxtPageAnalyzeContext,
  options: Pick<Required<NuxtI18nOptions>, 'pages' | 'defaultLocale' | 'customRoutes'>
): RouteOptionsResolver {
  const { pages, defaultLocale, customRoutes } = options

  const useConfig = customRoutes === 'config'
  debug('getRouteOptionsResolver useConfig', useConfig)

  return (route, localeCodes): ComputedRouteOptions | undefined => {
    const ret = useConfig
      ? getRouteOptionsFromPages(ctx, route, localeCodes, pages, defaultLocale)
      : getRouteOptionsFromComponent(route, localeCodes)
    debug('getRouteOptionsResolver resolved', route.path, route.name, ret)
    return ret
  }
}

function resolveRoutePath(path: string): string {
  const normalizePath = path.slice(1, path.length) // remove `/`
  const tokens = parseSegment(normalizePath)
  const routePath = getRoutePath(tokens)
  return routePath
}

/**
 * Retrieve custom routes from i18n config `pages` property
 */
function getRouteOptionsFromPages(
  ctx: NuxtPageAnalyzeContext,
  route: NuxtPage,
  localeCodes: string[],
  pages: CustomRoutePages,
  defaultLocale: string
) {
  const options: ComputedRouteOptions = {
    locales: localeCodes,
    paths: {}
  }

  // get `AnalyzedNuxtPageMeta` to use Vue Router path mapping
  const pageMeta = ctx.pages.get(route as unknown as NuxtPage)

  // skip if no `AnalyzedNuxtPageMeta`
  if (pageMeta == null) {
    console.warn(
      formatMessage(`Couldn't find AnalyzedNuxtPageMeta by NuxtPage (${route.path}), so no custom route for it`)
    )
    return options
  }

  const pageOptions = pageMeta.path ? pages[pageMeta.path] : undefined

  // routing disabled
  if (pageOptions === false) {
    return undefined
  }

  // skip if no page options defined
  if (!pageOptions) {
    return options
  }

  // remove disabled locales from page options
  options.locales = options.locales.filter(locale => pageOptions[locale] !== false)

  // construct paths object
  for (const locale of options.locales) {
    const customLocalePath = pageOptions[locale]
    if (isString(customLocalePath)) {
      // set custom path if any
      options.paths[locale] = resolveRoutePath(customLocalePath)
      continue
    }

    const customDefaultLocalePath = pageOptions[defaultLocale]
    if (isString(customDefaultLocalePath)) {
      // set default locale's custom path if any
      options.paths[locale] = resolveRoutePath(customDefaultLocalePath)
    }
  }

  return options
}

/**
 * Retrieve custom routes by parsing page components and extracting argument passed to `defineI18nRoute()`
 */
function getRouteOptionsFromComponent(route: NuxtPage, localeCodes: string[]) {
  debug('getRouteOptionsFromComponent', route)
  const file = route.file

  // localize disabled if no file (vite) or component (webpack)
  if (!isString(file)) {
    return undefined
  }

  const options: ComputedRouteOptions = {
    locales: localeCodes,
    paths: {}
  }

  const componentOptions = readComponent(file)

  // skip if page components not defined
  if (componentOptions == null) {
    return options
  }

  // localize disabled
  if (componentOptions === false) {
    return undefined
  }

  options.locales = componentOptions.locales || localeCodes

  // construct paths object
  for (const [locale, path] of Object.entries(componentOptions.paths ?? {})) {
    if (isString(path)) {
      options.paths[locale] = resolveRoutePath(path)
    }
  }

  return options
}

/**
 * Parse page component at `target` and extract argument passed to `defineI18nRoute()`
 */
function readComponent(target: string) {
  let options: ComputedRouteOptions | false | undefined = undefined

  try {
    const content = readFileSync(target)
    const { descriptor } = parseSFC(content)

    if (!content.includes(NUXT_I18N_COMPOSABLE_DEFINE_ROUTE)) {
      return options
    }

    const desc = compileScript(descriptor, { id: target })
    const { scriptSetupAst, scriptAst } = desc

    let extract = ''
    const genericSetupAst = scriptSetupAst || scriptAst
    if (genericSetupAst) {
      const s = new MagicString(desc.loc.source)
      genericSetupAst.forEach(ast => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        walk(ast as any, {
          enter(_node) {
            const node = _node as Node
            if (
              node.type === 'CallExpression' &&
              node.callee.type === 'Identifier' &&
              node.callee.name === NUXT_I18N_COMPOSABLE_DEFINE_ROUTE
            ) {
              const arg = node.arguments[0]
              if (arg.type === 'ObjectExpression') {
                if (verifyObjectValue(arg.properties) && arg.start != null && arg.end != null) {
                  extract = s.slice(arg.start, arg.end)
                }
              } else if (arg.type === 'BooleanLiteral' && arg.start != null && arg.end != null) {
                extract = s.slice(arg.start, arg.end)
              }
            }
          }
        })
      })
    }

    if (extract) {
      options = evalValue(extract)
    }
  } catch (e: unknown) {
    console.warn(formatMessage(`Couldn't read component data at ${target}: (${(e as Error).message})`))
  }

  return options
}

function verifyObjectValue(properties: ObjectExpression['properties']) {
  let ret = true
  for (const prop of properties) {
    if (prop.type === 'ObjectProperty') {
      if (
        (prop.key.type === 'Identifier' && prop.key.name === 'locales') ||
        (prop.key.type === 'StringLiteral' && prop.key.value === 'locales')
      ) {
        if (prop.value.type === 'ArrayExpression') {
          ret = verifyLocalesArrayExpression(prop.value.elements)
        } else {
          console.warn(formatMessage(`'locale' value is required array`))
          ret = false
        }
      } else if (
        (prop.key.type === 'Identifier' && prop.key.name === 'paths') ||
        (prop.key.type === 'StringLiteral' && prop.key.value === 'paths')
      ) {
        if (prop.value.type === 'ObjectExpression') {
          ret = verifyPathsObjectExpress(prop.value.properties)
        } else {
          console.warn(formatMessage(`'paths' value is required object`))
          ret = false
        }
      }
    } else {
      console.warn(formatMessage(`'defineI18nRoute' is required object`))
      ret = false
    }
  }
  return ret
}

function verifyPathsObjectExpress(properties: ObjectExpression['properties']) {
  let ret = true
  for (const prop of properties) {
    if (prop.type === 'ObjectProperty') {
      if (prop.key.type === 'Identifier' && prop.value.type !== 'StringLiteral') {
        console.warn(formatMessage(`'paths.${prop.key.name}' value is required string literal`))
        ret = false
      } else if (prop.key.type === 'StringLiteral' && prop.value.type !== 'StringLiteral') {
        console.warn(formatMessage(`'paths.${prop.key.value}' value is required string literal`))
        ret = false
      }
    } else {
      console.warn(formatMessage(`'paths' is required object`))
      ret = false
    }
  }
  return ret
}

function verifyLocalesArrayExpression(elements: ArrayExpression['elements']) {
  let ret = true
  for (const element of elements) {
    if (element?.type !== 'StringLiteral') {
      console.warn(formatMessage(`required 'locales' value string literal`))
      ret = false
    }
  }
  return ret
}

function evalValue(value: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return new Function(`return (${value})`)() as ComputedRouteOptions | false
  } catch (_e) {
    console.error(formatMessage(`Cannot evaluate value: ${value}`))
    return
  }
}
