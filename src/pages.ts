import createDebug from 'debug'
import { extendPages } from '@nuxt/kit'
import { I18nRoute, localizeRoutes, DefaultLocalizeRoutesPrefixable } from 'vue-i18n-routing'
import { isString } from '@intlify/shared'
import fs from 'node:fs'
import { formatMessage } from './utils'

import type { Nuxt, NuxtPage } from '@nuxt/schema'
import type { RouteOptionsResolver, ComputedRouteOptions, LocalizeRoutesPrefixableOptions } from 'vue-i18n-routing'
import type { NuxtI18nOptions, CustomRoutePages } from './types'

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
      : getRouteOptionsFromComponent(route)
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

function getRouteOptionsFromComponent(route: I18nRoute) {
  debug('getRouteOptionsFromComponent', route)
  const file = route.component || route.file
  if (!isString(file)) {
    return null
  }

  const componentOptions = readComponent(file)
  if (componentOptions === false) {
    return null
  } else {
    return componentOptions
  }
}

function readComponent(target: string) {
  let options: ComputedRouteOptions | false = false
  try {
    const content = fs.readFileSync(target, 'utf8').toString()
    const { 0: match, index = 0 } =
      content.match(new RegExp(`\\b${'defineI18nRoute'}\\s*\\(\\s*`)) || ({} as RegExpMatchArray)
    const macroContent = match ? extractValue(content.slice(index + match.length)) : 'false'
    options = new Function(`return (${macroContent})`)()
  } catch (e: unknown) {
    console.warn(formatMessage(`Couldn't read component data at ${target}: (${(e as Error).message})`))
  }
  return options
}

const starts = {
  '{': '}',
  '[': ']',
  '(': ')',
  '<': '>',
  '"': '"',
  "'": "'"
}
const REGEX_QUOTE = /["']/
const REGEX_FALSE = /false/

function extractValue(code: string) {
  // Strip comments
  code = code.replace(/^\s*\/\/.*$/gm, '')

  if (REGEX_FALSE.test(code)) {
    return 'false'
  }

  const stack: string[] = []
  let result = ''
  do {
    if (stack[0] === code[0] && result.slice(-1) !== '\\') {
      stack.shift()
    } else if (code[0] in starts && !REGEX_QUOTE.test(stack[0])) {
      stack.unshift(starts[code[0] as keyof typeof starts])
    }
    result += code[0]
    code = code.slice(1)
  } while (stack.length && code.length)
  return result
}
