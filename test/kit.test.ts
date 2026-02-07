import { describe, test, expect, vi } from 'vitest'
import { type ComposableContext, isRouteLocationPathRaw, prefixable } from '../src/runtime/utils'
import { createLocaleRouteNameGetter, createLocalizedRouteByPathResolver } from '../src/runtime/routing/utils'
import { getRouteBaseName as _getRouteBaseName } from '#i18n-kit/routing'
import { createMemoryHistory, createRouter, type RouteLocationRaw } from 'vue-router'
import { type RouteRecordNameGeneric, type Router } from 'vue-router'
import { type RouteLocationGenericPath } from '../src/runtime/types'
import {
  localePath as _localePath,
  switchLocalePath as _switchLocalePath,
  localeRoute as _localeRoute,
  type RouteLike,
  type RouteLikeWithName,
  type RouteLikeWithPath
} from '../src/runtime/routing/routing'
import { withTrailingSlash, withoutTrailingSlash } from 'ufo'
import { reactive, ref, unref } from 'vue'
import { buildNuxt, loadNuxt } from '@nuxt/kit'
import { resolve } from 'pathe'
import { localizeRoutes } from '../src/routing'
import { getNormalizedLocales } from './pages/utils'
import type { NuxtPage } from '@nuxt/schema'
import type { Strategies } from '#internal-i18n-types'
import { LocalizableRoute } from '../src/kit/gen'

const routingOptions = reactive({
  strategy: 'prefix_and_default' as Strategies,
  differentDomains: false,
  routesNameSeparator: '___',
  defaultLocaleRouteNameSuffix: 'default',
  trailingSlash: false,
  defaultLocale: 'en',
  defaultDirection: 'ltr' as const
})

const i18nMock = {
  locale: ref('en'),
  locales: ref([
    { code: 'en', language: 'en-US' },
    { code: 'nl', language: 'nl-NL ' }
  ]),
  baseUrl: ref('http://localhost')
}

// more flexible implementation of `initComposableOptions` in src/runtime/utils.ts
function initComposableOptions(router: Router): ComposableContext {
  vi.stubGlobal('__I18N_STRATEGY__', routingOptions.strategy)
  vi.stubGlobal('__I18N_ROUTING__', routingOptions.strategy !== 'no_prefix')

  const getLocalizedRouteName = (name: RouteRecordNameGeneric | null, locale: string) =>
    createLocaleRouteNameGetter(routingOptions.defaultLocale)(name, locale)
  const { differentDomains, defaultLocale, trailingSlash, defaultDirection } = routingOptions

  // const getDomainFromLocale = (locale: string) => undefined
  const routeByPathResolver = (input: RouteLikeWithPath, locale: string) =>
    createLocalizedRouteByPathResolver(router)(input, locale)

  function getRouteBaseName(route: RouteRecordNameGeneric | RouteLocationGenericPath | null) {
    return _getRouteBaseName(route)
  }

  function resolveLocalizedRouteByName(route: RouteLikeWithName, locale: string) {
    // if name is falsy fallback to current route name
    route.name ||= getRouteBaseName(router.currentRoute.value)

    // route localization may be disabled, check if localized variant exists
    const localizedName = getLocalizedRouteName(route.name, locale)
    if (router.hasRoute(localizedName)) {
      route.name = localizedName
    }

    return route
  }

  const formatTrailingSlash = trailingSlash ? withTrailingSlash : withoutTrailingSlash
  function resolveLocalizedRouteByPath(input: RouteLikeWithPath, locale: string) {
    const route = routeByPathResolver(input, locale) as RouteLike

    const resolvedName = getRouteBaseName(route)
    if (resolvedName) {
      route.name = getLocalizedRouteName(resolvedName, locale)
      return route
    }

    // if route has a path defined but no name, resolve full route using the path
    if (!differentDomains && prefixable(locale, defaultLocale)) {
      route.path = '/' + locale + route.path
    }

    route.path = formatTrailingSlash(route.path, true)
    return route
  }

  return {
    router,
    routingOptions: {
      ...routingOptions,
      // defaultDirection: routingOptions.defaultDirection,
      strictCanonicals: true,
      hreflangLinks: true
    },
    getLocale: () => unref(i18nMock.locale),
    getLocales: () => unref(i18nMock.locales),
    getBaseUrl: () => unref(i18nMock.baseUrl),
    getRouteBaseName,
    getLocalizedDynamicParams: locale => {
      // const params = (router.currentRoute.value.meta[DYNAMIC_PARAMS_KEY] ?? {}) as Partial<I18nRouteMeta>
      // return params[locale]
      return undefined
    },
    afterSwitchLocalePath: (path, locale) => {
      // if (differentDomains) {
      //   const domain = getDomainFromLocale(locale)
      //   return (domain && joinURL(domain, path)) || path
      // }
      return path
    },
    resolveLocalizedRouteObject: (route, locale) => {
      if (isRouteLocationPathRaw(route)) {
        return resolveLocalizedRouteByPath(route, locale)
      }

      return resolveLocalizedRouteByName(route, locale)
    }
  }
}

// also updates i18nMock for now
async function loadFixtureAndRoutes() {
  const nuxt = await loadNuxt({
    rootDir: resolve(process.cwd(), './test/fixtures/kit'),
    configFile: 'nuxt.config',
    dev: false,
    overrides: {
      experimental: {
        // extraPageMetaExtractionKeys: ['i18n'],
        // scanPageMeta: 'after-resolve'
      }
    }
  })
  const locales = getNormalizedLocales(nuxt.options.i18n.locales)
  i18nMock.locale.value = locales[0].code
  i18nMock.locales.value = locales.map(x => ({ code: x.code, language: x.language ?? x.code }))
  i18nMock.baseUrl.value = String(nuxt.options.i18n.baseUrl)
  async function getPages() {
    try {
      return await new Promise(res => {
        nuxt.hook('pages:resolved', pages => res(pages))
        buildNuxt(nuxt)
      })
    } finally {
      nuxt.close()
    }
  }
  return (await getPages()) as NuxtPage[]
}

function localizeRoutesWithStrategy(routes: NuxtPage[], strategy?: Strategies) {
  if (strategy) {
    routingOptions.strategy = strategy
    globalThis['__I18N_STRATEGY__'] = strategy
  }
  return localizeRoutes(routes as LocalizableRoute[], { ...routingOptions, locales: unref(i18nMock.locales) })
}

describe('testing', () => {
  test('switching locale path', async () => {
    const routes = await loadFixtureAndRoutes()
    const localized = localizeRoutesWithStrategy(routes, 'prefix_and_default')
    const router = createRouter({ routes: localized as any, history: createMemoryHistory() })

    const options = initComposableOptions(router)
    await options.router.push('/')

    const localePath = (route: RouteLocationRaw, locale?: string) => _localePath(options, route, locale)
    const localeRoute = (route: RouteLocationRaw, locale?: string) => {
      const val = _localeRoute(options, route, locale)
      if (val) {
        // @ts-expect-error wrong type
        delete val.matched
      }
      return val
    }
    const switchLocalePath = (locale: string) => _switchLocalePath(options, locale)

    expect(localePath('/')).toMatchInlineSnapshot(`"/"`)
    expect(localePath('index', 'ja')).toMatchInlineSnapshot(`"/ja"`)

    // name
    expect(localePath('about')).toMatchInlineSnapshot(`"/about"`)

    // path
    expect(localePath('/about', 'ja')).toMatchInlineSnapshot(`"/ja/about"`)
    expect(localePath('pathMatch')).toMatchInlineSnapshot(`"/"`)
    expect(localePath('pathMatch', 'ja')).toMatchInlineSnapshot(`"/ja"`)

    // object
    expect(localePath({ name: 'about' }, 'ja')).toMatchInlineSnapshot(`"/ja/about"`)

    // omit name & path
    expect(localePath({ state: { foo: 1 } })).toMatchInlineSnapshot(`"/"`)

    // preserve query parameters
    expect(localePath({ query: { foo: 1 } })).toMatchInlineSnapshot(`"/?foo=1"`)
    expect(localePath({ path: '/', query: { foo: 1 } })).toMatchInlineSnapshot(`"/?foo=1"`)
    expect(localePath({ name: 'about', query: { foo: 1 } })).toMatchInlineSnapshot(`"/about?foo=1"`)
    expect(localePath({ path: '/about', query: { foo: 1 } })).toMatchInlineSnapshot(`"/about?foo=1"`)
    expect(localePath('/?foo=1')).toMatchInlineSnapshot(`"/?foo=1"`)
    expect(localePath('/about?foo=1')).toMatchInlineSnapshot(`"/about?foo=1"`)
    expect(localePath('/about?foo=1&test=2')).toMatchInlineSnapshot(`"/about?foo=1&test=2"`)
    expect(localePath('/path/as a test?foo=bar sentence')).toMatchInlineSnapshot(`"/path/as a test?foo=bar+sentence"`)
    expect(localePath('/path/as%20a%20test?foo=bar%20sentence')).toMatchInlineSnapshot(
      `"/path/as a test?foo=bar+sentence"`
    )
    expect(localePath({ path: '/about', hash: '#foo=bar' })).toMatchInlineSnapshot(`"/about#foo=bar"`)

    // undefined path
    expect(localePath('/vue-i18n')).toMatchInlineSnapshot(`"/vue-i18n"`)

    // undefined name
    expect(localePath('vue-i18n')).toMatchInlineSnapshot(`""`)

    // external
    expect(localePath('https://github.com')).toMatchInlineSnapshot(`"https://github.com"`)
    expect(localePath('mailto:example@mail.com')).toMatchInlineSnapshot(`"mailto:example@mail.com"`)
    expect(localePath('tel:+31612345678')).toMatchInlineSnapshot(`"tel:+31612345678"`)

    // locale route tests
    expect(localeRoute('/')).toMatchInlineSnapshot(
      `
      {
        "fullPath": "/",
        "hash": "",
        "href": "/",
        "meta": {},
        "name": "index___en___default",
        "params": {},
        "path": "/",
        "query": {},
        "redirectedFrom": undefined,
      }
    `
    )
    expect(localeRoute('index', 'ja')).toMatchInlineSnapshot(
      `
      {
        "fullPath": "/ja",
        "hash": "",
        "href": "/ja",
        "meta": {},
        "name": "index___ja",
        "params": {},
        "path": "/ja",
        "query": {},
        "redirectedFrom": undefined,
      }
    `
    )
    expect(localeRoute('about')).toMatchInlineSnapshot(
      `
      {
        "fullPath": "/about",
        "hash": "",
        "href": "/about",
        "meta": {},
        "name": "about___en___default",
        "params": {},
        "path": "/about",
        "query": {},
        "redirectedFrom": undefined,
      }
    `
    )
    expect(localeRoute('/about', 'ja')).toMatchInlineSnapshot(
      `
      {
        "fullPath": "/ja/about",
        "hash": "",
        "href": "/ja/about",
        "meta": {},
        "name": "about___ja",
        "params": {},
        "path": "/ja/about",
        "query": {},
        "redirectedFrom": undefined,
      }
    `
    )
    expect(localeRoute('about', 'ja')).toMatchInlineSnapshot(
      `
      {
        "fullPath": "/ja/about",
        "hash": "",
        "href": "/ja/about",
        "meta": {},
        "name": "about___ja",
        "params": {},
        "path": "/ja/about",
        "query": {},
        "redirectedFrom": undefined,
      }
    `
    )
    expect(localeRoute({ name: 'about' }, 'ja')).toMatchInlineSnapshot(
      `
      {
        "fullPath": "/ja/about",
        "hash": "",
        "href": "/ja/about",
        "meta": {},
        "name": "about___ja",
        "params": {},
        "path": "/ja/about",
        "query": {},
        "redirectedFrom": undefined,
      }
    `
    )
    expect(localeRoute('/:pathMatch(.*)*', 'ja')).toMatchInlineSnapshot(
      `
      {
        "fullPath": "/ja/:pathMatch(.*)*",
        "hash": "",
        "href": "/ja/:pathMatch(.*)*",
        "meta": {},
        "name": "pathMatch___ja",
        "params": {
          "pathMatch": [
            ":pathMatch(.*)*",
          ],
        },
        "path": "/ja/:pathMatch(.*)*",
        "query": {},
        "redirectedFrom": undefined,
      }
    `
    )
    expect(localeRoute('pathMatch')).toMatchInlineSnapshot(
      `
      {
        "fullPath": "/",
        "hash": "",
        "href": "/",
        "meta": {},
        "name": "pathMatch___en___default",
        "params": {},
        "path": "/",
        "query": {},
        "redirectedFrom": undefined,
      }
    `
    )
    expect(localeRoute('pathMatch', 'ja')).toMatchInlineSnapshot(
      `
      {
        "fullPath": "/ja",
        "hash": "",
        "href": "/ja",
        "meta": {},
        "name": "pathMatch___ja",
        "params": {},
        "path": "/ja",
        "query": {},
        "redirectedFrom": undefined,
      }
    `
    )
    expect(localeRoute('/vue-i18n', 'ja')).toMatchInlineSnapshot(
      `
      {
        "fullPath": "/ja/vue-i18n",
        "hash": "",
        "href": "/ja/vue-i18n",
        "meta": {},
        "name": "pathMatch___ja",
        "params": {
          "pathMatch": [
            "vue-i18n",
          ],
        },
        "path": "/ja/vue-i18n",
        "query": {},
        "redirectedFrom": undefined,
      }
    `
    )
    expect(localeRoute('vue-i18n', 'ja')).toMatchInlineSnapshot(`undefined`)

    // switching to prefix strategy
    const localizedPrefixed = localizeRoutesWithStrategy(routes, 'prefix')
    // clear routes and add regenerated routes
    router.clearRoutes()
    for (const r of localizedPrefixed) {
      router.addRoute(r as any)
    }
    await router.push('/en')

    expect(switchLocalePath('en')).toEqual('/en')
    expect(switchLocalePath('ja')).toEqual('/ja')
    expect(switchLocalePath('undefined')).toEqual('')

    await router.push('/ja/about')

    expect(switchLocalePath('en')).toEqual('/en/about')
    expect(switchLocalePath('ja')).toEqual('/ja/about')

    await router.push('/ja/about?foo=1&test=2')
    expect(switchLocalePath('en')).toEqual('/en/about?foo=1&test=2')
    expect(switchLocalePath('ja')).toEqual('/ja/about?foo=1&test=2')

    await router.push('/ja/about?foo=bär&four=四&foo=bar')
    expect(switchLocalePath('ja')).toEqual('/ja/about?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')
    expect(switchLocalePath('en')).toEqual('/en/about?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')

    await router.push('/ja/about?foo=bär&four=四')
    expect(switchLocalePath('ja')).toEqual('/ja/about?foo=b%C3%A4r&four=%E5%9B%9B')
    expect(switchLocalePath('en')).toEqual('/en/about?foo=b%C3%A4r&four=%E5%9B%9B')

    await router.push('/ja/about#foo=bar')
    expect(switchLocalePath('ja')).toEqual('/ja/about#foo=bar')
    expect(switchLocalePath('en')).toEqual('/en/about#foo=bar')

    await router.push('/ja/about?foo=é')
    expect(switchLocalePath('ja')).toEqual('/ja/about?foo=%C3%A9')

    // TODO: figure out what was being tested originally
    // await router.push('/ja/category/1');
    // expect(switchLocalePath('ja')).toEqual('/ja/category/japanese');
    // expect(switchLocalePath('en')).toEqual('/en/category/english');

    await router.push('/ja/count/三')
    expect(switchLocalePath('ja')).toEqual('/ja/count/三')
    expect(switchLocalePath('en')).toEqual('/en/count/三')

    await router.push('/ja/count/三?foo=bär&four=四&foo=bar')
    expect(switchLocalePath('ja')).toEqual('/ja/count/三?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')
    expect(switchLocalePath('en')).toEqual('/en/count/三?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')
  })
})
