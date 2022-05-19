import createDebug from 'debug'
import { extendPages } from '@nuxt/kit'
import { localizeRoutes } from 'vue-i18n-routing'

import type { Nuxt, NuxtPage } from '@nuxt/schema'
import type { RouteOptionsResolver, ComputedRouteOptions } from 'vue-i18n-routing'
import type { NuxtI18nOptions, CustomRoutePages } from './types'

const debug = createDebug('@nuxtjs/i18n:pages')

export function setupPages(
  options: Required<NuxtI18nOptions>,
  nuxt: Nuxt,
  additionalOptions: { isBridge?: boolean; localeCodes: string[] } = {
    isBridge: false,
    localeCodes: []
  }
) {
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
      optionsResolver: getRouteOptionsResolver(options.pages, pagesDir, options.defaultLocale)
    })
    pages.splice(0, pages.length)
    pages.unshift(...(localizedPages as NuxtPage[]))
    debug('... made pages', pages)
  })
}

function getRouteOptionsResolver(
  pages: CustomRoutePages,
  pagesDir: string,
  defaultLocale: string
): RouteOptionsResolver {
  return (route, localeCodes): ComputedRouteOptions | null => {
    const options: ComputedRouteOptions = {
      locales: localeCodes,
      paths: {}
    }
    const pattern = new RegExp(`${pagesDir}/`, 'i')
    // TODO: we might be needed support for vite, this is for webpack
    const chunkName = route.chunkName ? route.chunkName.replace(pattern, '') : route.name
    const pageOptions = chunkName ? pages[chunkName] : undefined
    // Routing disabled
    if (pageOptions === false) {
      return null
    }
    // Skip if no page options defined
    if (!pageOptions) {
      return options
    }

    // Remove disabled locales from page options
    options.locales = options.locales.filter(locale => pageOptions[locale] !== false)

    // Construct paths object
    for (const locale of options.locales) {
      const customLocalePath = pageOptions[locale]
      if (typeof customLocalePath === 'string') {
        // Set custom path if any
        options.paths[locale] = customLocalePath
        continue
      }

      const customDefaultLocalePath = pageOptions[defaultLocale]
      if (typeof customDefaultLocalePath === 'string') {
        // Set default locale's custom path if any
        options.paths[locale] = customDefaultLocalePath
      }
    }

    return options
  }
}
