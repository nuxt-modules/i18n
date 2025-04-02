import createDebug from 'debug'
import { addTemplate } from '@nuxt/kit'
import { readFileSync } from 'node:fs'
import { isString } from '@intlify/shared'
import { parse as parseSFC, compileScript } from '@vue/compiler-sfc'
import { walk } from 'estree-walker'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { formatMessage } from './utils'
import { getRoutePath, parseSegment } from './utils/route-parsing'
import { localizeRoutes, type ComputedRouteOptions, type RouteOptionsResolver } from './routing'
import { mergeLayerPages } from './layers'
import { resolve, parse as parsePath, dirname } from 'pathe'
import { NUXT_I18N_COMPOSABLE_DEFINE_ROUTE } from './constants'
import { createRoutesContext } from 'unplugin-vue-router'
import { resolveOptions } from 'unplugin-vue-router/options'

import type { Nuxt, NuxtPage } from '@nuxt/schema'
import type { Node, ObjectExpression, ArrayExpression, Expression, PrivateName } from '@babel/types'
import type { EditableTreeNode, Options as TypedRouterOptions } from 'unplugin-vue-router'
import type { NuxtI18nOptions, CustomRoutePages } from './types'
import type { I18nNuxtContext } from './context'

const debug = createDebug('@nuxtjs/i18n:pages')

export type AnalyzedNuxtPageMeta = {
  inRoot: boolean
  /**
   * Analyzed path used to retrieve configured custom paths
   */
  path: string
  name?: string
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

export async function setupPages({ localeCodes, options, isSSR }: I18nNuxtContext, nuxt: Nuxt) {
  if (!localeCodes.length) return

  let includeUnprefixedFallback = !isSSR
  nuxt.hook('nitro:init', () => {
    debug('enable includeUprefixedFallback')
    includeUnprefixedFallback = options.strategy !== 'prefix'
  })

  const pagesDir = nuxt.options.dir && nuxt.options.dir.pages ? nuxt.options.dir.pages : 'pages'
  const srcDir = nuxt.options.srcDir
  debug(`pagesDir: ${pagesDir}, srcDir: ${srcDir}, trailingSlash: ${options.trailingSlash}`)

  const typedRouter = await setupExperimentalTypedRoutes(options, nuxt)

  const pagesHook: Parameters<(typeof nuxt)['hook']>[0] =
    nuxt.options.experimental.scanPageMeta === 'after-resolve' ? 'pages:resolved' : 'pages:extend'

  nuxt.hook(pagesHook, async pages => {
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

    if (typedRouter) {
      await typedRouter.createContext(pages).scanPages(false)
    }

    const localizedPages = localizeRoutes(pages, {
      ...options,
      localeCodes,
      includeUnprefixedFallback,
      optionsResolver: getRouteOptionsResolver(ctx, options)
    })

    // keep root when using prefixed routing without prerendering
    const indexPage = pages.find(x => x.path === '/')
    if (!nuxt.options._generate && options.strategy === 'prefix' && indexPage != null) {
      localizedPages.unshift(indexPage)
    }

    // do not mutate pages if localization is skipped
    if (pages !== localizedPages) {
      pages.length = 0
      pages.unshift(...localizedPages)
    }

    debug('... made pages', pages)
  })
}

/**
 * Expression to to find the `RouteNamedMap` generated by uvr, used to replace with `RouteNamedMapI18n`
 */
const routeNamedMapTypeRE = /RouteNamedMap\b/

/**
 * Declaration file containing the generated route types
 */
const declarationFile = './types/typed-router-i18n.d.ts'

/**
 * Setup experiment typed routes feature if enabled
 */
async function setupExperimentalTypedRoutes(userOptions: NuxtI18nOptions, nuxt: Nuxt) {
  if (!nuxt.options.experimental.typedPages || userOptions.experimental?.typedPages === false) {
    return undefined
  }

  const dtsFile = resolve(nuxt.options.buildDir, declarationFile)

  /**
   * Typed route generation from Nuxt with modifications
   * https://github.com/nuxt/nuxt/blob/781d8c4174c410a7aff6b809817b15eae85d3ba8/packages/nuxt/src/pages/module.ts#L160-L208
   */
  function createContext(pages: NuxtPage[]) {
    const typedRouteroptions: TypedRouterOptions = {
      routesFolder: [],
      dts: dtsFile,
      logs: !!nuxt.options.debug,
      watch: false,
      // eslint-disable-next-line @typescript-eslint/require-await
      async beforeWriteFiles(rootPage) {
        rootPage.children.forEach(child => child.delete())
        function addPage(parent: EditableTreeNode, page: NuxtPage) {
          // @ts-expect-error TODO: either fix types upstream or figure out another
          // way to add a route without a file, which must be possible
          const route = parent.insert(page.path, page.file)
          if (page.meta) {
            route.addToMeta(page.meta)
          }
          if (page.alias) {
            route.addAlias(page.alias)
          }
          if (page.name) {
            route.name = page.name
          }
          // TODO: implement redirect support
          // if (page.redirect) {}
          if (page.children) {
            page.children.forEach(child => addPage(route, child))
          }
        }

        for (const page of pages) {
          addPage(rootPage, page)
        }
      }
    }

    const context = createRoutesContext(resolveOptions(typedRouteroptions))

    /**
     * Wrap `scanPages` to rename interface `RouteNamedMap` => `RouteNamedMapI18n`
     */
    const originalScanPages = context.scanPages.bind(context)
    context.scanPages = async function (watchers = false) {
      await mkdir(dirname(dtsFile), { recursive: true })
      await originalScanPages(watchers)

      const dtsContent = await readFile(dtsFile, 'utf-8')

      if (routeNamedMapTypeRE.test(dtsContent)) {
        await writeFile(dtsFile, dtsContent.replace(routeNamedMapTypeRE, 'RouteNamedMapI18n'))
      }
    }

    return context
  }

  addTemplate({
    filename: resolve(nuxt.options.buildDir, './types/i18n-generated-route-types.d.ts'),
    getContents: () => {
      return `// Generated by @nuxtjs/i18n
declare module 'vue-router' {
  import type { RouteNamedMapI18n } from 'vue-router/auto-routes'

  export interface TypesConfig {
    RouteNamedMapI18n: RouteNamedMapI18n
  }
}

export {}`
    }
  })

  nuxt.hook('prepare:types', ({ references }) => {
    // This file will be generated by unplugin-vue-router
    references.push({ path: declarationFile })
    references.push({ types: './types/i18n-generated-route-types.d.ts' })
  })

  await createContext(nuxt.apps.default?.pages ?? []).scanPages(false)

  return { createContext }
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
      // if route has an index child the parent will not have a name
      name: page.name ?? page.children?.find(x => x.path.endsWith('/index'))?.name,
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

  const getter = useConfig ? getRouteOptionsFromPages : getRouteOptionsFromComponent
  return (route, localeCodes) => {
    const ret = getter(route, localeCodes, ctx, pages, defaultLocale)
    debug('getRouteOptionsResolver resolved', route.path, route.name, ret)
    return ret
  }
}

function resolveRoutePath(path: string): string {
  const normalizePath = path.slice(1, path.length) // remove `/`
  const tokens = parseSegment(normalizePath)
  return getRoutePath(tokens)
}

/**
 * Retrieve custom routes from i18n config `pages` property
 */
function getRouteOptionsFromPages(
  route: NuxtPage,
  localeCodes: string[],
  ctx: NuxtPageAnalyzeContext,
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

  const valueByName = pageMeta.name ? pages[pageMeta.name] : undefined
  const pageOptions = valueByName ?? pages[pageMeta.path]

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
    // set custom path if any
    if (isString(pageOptions[locale])) {
      options.paths[locale] = resolveRoutePath(pageOptions[locale])
      continue
    }

    // set default locale's custom path if any
    if (isString(pageOptions[defaultLocale])) {
      options.paths[locale] = resolveRoutePath(pageOptions[defaultLocale])
    }
  }

  return options
}

/**
 * Retrieve custom routes by parsing page components and extracting argument passed to `defineI18nRoute()`
 */
function getRouteOptionsFromComponent(route: NuxtPage, localeCodes: string[]) {
  debug('getRouteOptionsFromComponent', route)

  // localize disabled if no file (vite) or component (webpack)
  if (route.file == null) {
    return undefined
  }

  const options: ComputedRouteOptions = {
    locales: localeCodes,
    paths: {}
  }

  const componentOptions = readComponent(route.file)

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
  for (const locale in componentOptions.paths) {
    if (isString(componentOptions.paths[locale])) {
      options.paths[locale] = resolveRoutePath(componentOptions.paths[locale])
    }
  }

  return options
}

/**
 * Parse page component at `target` and extract argument passed to `defineI18nRoute()`
 */
function readComponent(target: string) {
  try {
    const content = readFileSync(target, 'utf-8')
    const { descriptor } = parseSFC(content)

    if (!content.includes(NUXT_I18N_COMPOSABLE_DEFINE_ROUTE)) {
      return undefined
    }

    const desc = compileScript(descriptor, { id: target })

    let extract = ''
    const genericSetupAst = desc.scriptSetupAst || desc.scriptAst || []
    for (const ast of genericSetupAst) {
      // @ts-expect-error type mismatch
      walk(ast, {
        enter(node: Node) {
          if (node.type !== 'CallExpression') return
          if (node.callee.type === 'Identifier' && node.callee.name === NUXT_I18N_COMPOSABLE_DEFINE_ROUTE) {
            const arg = node.arguments[0]
            if (
              arg.type === 'BooleanLiteral' ||
              (arg.type === 'ObjectExpression' && verifyObjectValue(arg.properties))
            ) {
              extract = desc.loc.source.slice(arg.start!, arg.end!)
            }
          }
        }
      })
    }

    if (extract) {
      return evalValue(extract)
    }
  } catch (e: unknown) {
    console.warn(formatMessage(`Couldn't read component data at ${target}: (${(e as Error).message})`))
  }

  return undefined
}

function nodeNameOrValue(val: PrivateName | Expression, name: string) {
  return (val.type === 'Identifier' && val.name === name) || (val.type === 'StringLiteral' && val.value === name)
}

function verifyObjectValue(properties: ObjectExpression['properties']) {
  for (const prop of properties) {
    if (prop.type !== 'ObjectProperty') {
      console.warn(formatMessage(`'defineI18nRoute' requires an object as argument`))
      return false
    }

    if (nodeNameOrValue(prop.key, 'locales')) {
      if (prop.value.type !== 'ArrayExpression' || !verifyLocalesArrayExpression(prop.value.elements)) {
        console.warn(formatMessage(`expected 'locale' to be an array`))
        return false
      }
    }

    if (nodeNameOrValue(prop.key, 'paths')) {
      if (prop.value.type !== 'ObjectExpression' || !verifyPathsObjectExpress(prop.value.properties)) {
        console.warn(formatMessage(`expected 'paths' to be an object`))
        return false
      }
    }
  }

  return true
}

function verifyPathsObjectExpress(properties: ObjectExpression['properties']) {
  for (const prop of properties) {
    if (prop.type !== 'ObjectProperty') {
      console.warn(formatMessage(`'paths' is required object`))
      return false
    }

    if (prop.key.type === 'Identifier' && prop.value.type !== 'StringLiteral') {
      console.warn(formatMessage(`expected 'paths.${prop.key.name}' to be a string literal`))
      return false
    }

    if (prop.key.type === 'StringLiteral' && prop.value.type !== 'StringLiteral') {
      console.warn(formatMessage(`expected 'paths.${prop.key.value}' to be a string literal`))
      return false
    }
  }

  return true
}

function verifyLocalesArrayExpression(elements: ArrayExpression['elements']) {
  for (const element of elements) {
    if (element?.type !== 'StringLiteral') {
      console.warn(formatMessage(`required 'locales' value string literal`))
      return false
    }
  }
  return true
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
