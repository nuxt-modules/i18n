import createDebug from 'debug'
import { extendPages } from '@nuxt/kit'
import { I18nRoute, localizeRoutes, DefaultLocalizeRoutesPrefixable } from 'vue-i18n-routing'
import { isString } from '@intlify/shared'
import fs from 'node:fs'
import { parse as parseSFC, compileScript } from '@vue/compiler-sfc'
import { walk } from 'estree-walker'
import MagicString from 'magic-string'
import { formatMessage } from './utils'

import type { Nuxt, NuxtPage } from '@nuxt/schema'
import type { RouteOptionsResolver, ComputedRouteOptions, LocalizeRoutesPrefixableOptions } from 'vue-i18n-routing'
import type { NuxtI18nOptions, CustomRoutePages } from './types'
import type { Node, ObjectExpression, ArrayExpression } from '@babel/types'

const debug = createDebug('@nuxtjs/i18n:pages')

export function setupPages(
  options: Required<NuxtI18nOptions>,
  nuxt: Nuxt,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  additionalOptions: { isBridge?: boolean; localeCodes: string[] } = {
    isBridge: false,
    localeCodes: []
  }
) {
  // override prefixable path for localized target routes
  function localizeRoutesPrefixable(opts: LocalizeRoutesPrefixableOptions): boolean {
    // no prefix if app uses different locale domains
    return !options.differentDomains && DefaultLocalizeRoutesPrefixable(opts)
  }

  let includeUprefixedFallback = nuxt.options.target === 'static'
  nuxt.hook('generate:before', () => {
    debug('called generate:before hook')
    includeUprefixedFallback = true
  })

  const pagesDir = nuxt.options.dir && nuxt.options.dir.pages ? nuxt.options.dir.pages : 'pages'
  const { trailingSlash } = nuxt.options.router
  debug(`pagesDir: ${pagesDir}, tailingSlash: ${trailingSlash}`)

  extendPages(pages => {
    debug('pages making ...', pages)
    const localizedPages = localizeRoutes(pages, {
      ...options,
      includeUprefixedFallback,
      localizeRoutesPrefixable,
      optionsResolver: getRouteOptionsResolver(pagesDir, options)
    })
    pages.splice(0, pages.length)
    pages.unshift(...(localizedPages as NuxtPage[]))
    debug('... made pages', pages)
  })
}

export function getRouteOptionsResolver(
  pagesDir: string,
  options: Pick<Required<NuxtI18nOptions>, 'pages' | 'defaultLocale' | 'parsePages'>
): RouteOptionsResolver {
  const { pages, defaultLocale, parsePages } = options
  debug('parsePages on getRouteOptionsResolver', parsePages)
  return (route, localeCodes): ComputedRouteOptions | null => {
    const ret = !parsePages
      ? getRouteOptionsFromPages(pagesDir, route, localeCodes, pages, defaultLocale)
      : getRouteOptionsFromComponent(route, localeCodes)
    debug('getRouteOptionsResolver resolved', route.path, route.name, ret)
    return ret
  }
}

function getRouteOptionsFromPages(
  pagesDir: string,
  route: I18nRoute,
  localeCodes: string[],
  pages: CustomRoutePages,
  defaultLocale: string
) {
  const options: ComputedRouteOptions = {
    locales: localeCodes,
    paths: {}
  }
  const pattern = new RegExp(`${pagesDir}/`, 'i')
  // prettier-ignore
  const path = route.chunkName
    ? route.chunkName.replace(pattern, '') // for webpack
    : route.path  // vite and webpack
      ? route.path.substring(1) // extract `/`
      : route.name
  const pageOptions = path ? pages[path] : undefined
  // routing disabled
  if (pageOptions === false) {
    return null
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
      options.paths[locale] = customLocalePath
      continue
    }

    const customDefaultLocalePath = pageOptions[defaultLocale]
    if (isString(customDefaultLocalePath)) {
      // set default locale's custom path if any
      options.paths[locale] = customDefaultLocalePath
    }
  }

  return options
}

function getRouteOptionsFromComponent(route: I18nRoute, localeCodes: string[]) {
  debug('getRouteOptionsFromComponent', route)
  const file = route.component || route.file
  if (!isString(file)) {
    return null
  }

  const componentOptions = readComponent(file)
  if (componentOptions == null) {
    return {
      locales: localeCodes,
      paths: {}
    }
  } else if (componentOptions === false) {
    return null
  } else {
    return componentOptions
  }
}

function readComponent(target: string) {
  let options: ComputedRouteOptions | false | undefined = undefined

  try {
    const content = fs.readFileSync(target, 'utf8').toString()
    const { descriptor } = parseSFC(content)
    const desc = compileScript(descriptor, { id: target })
    const { scriptSetupAst } = desc
    let extract = ''
    if (scriptSetupAst) {
      const s = new MagicString(desc.loc.source)
      scriptSetupAst.forEach(ast => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        walk(ast as any, {
          enter(_node) {
            const node = _node as Node
            if (
              node.type === 'CallExpression' &&
              node.callee.type === 'Identifier' &&
              node.callee.name === 'defineI18nRoute'
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
    options = evalValue(extract)
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
          console.warn(formatMessage(`'locale' value is required array expression`))
          ret = false
        }
      } else if (
        (prop.key.type === 'Identifier' && prop.key.name === 'paths') ||
        (prop.key.type === 'StringLiteral' && prop.key.value === 'paths')
      ) {
        if (prop.value.type === 'ObjectExpression') {
          ret = verifyPathsObjectExpress(prop.value.properties)
        } else {
          console.warn(formatMessage(`'paths' value is required object expression`))
          ret = false
        }
      }
    } else {
      console.warn(formatMessage(`'defineI18nRoute' object expression properties type is required object property`))
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
      console.warn(formatMessage(`'paths' is required object property`))
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
    return new Function(`return (${value})`)() as ComputedRouteOptions | false
  } catch (e) {
    console.error(formatMessage(`Cannot evaluate value: ${value}`))
    return
  }
}
