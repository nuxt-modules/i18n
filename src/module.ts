import createDebug from 'debug'
import {
  defineNuxtModule,
  isNuxt2,
  isNuxt3,
  getNuxtVersion,
  addComponent,
  addPlugin,
  addTemplate,
  addTypeTemplate,
  addImports,
  useLogger
} from '@nuxt/kit'
import { resolve, relative } from 'pathe'
import { defu } from 'defu'
import { setupAlias } from './alias'
import { setupPages } from './pages'
import { setupNitro } from './nitro'
import { extendBundler } from './bundler'
import { generateI18nPageTypes, generateI18nTypes, generateLoaderOptions, simplifyLocaleOptions } from './gen'
import {
  NUXT_I18N_MODULE_ID,
  DEFAULT_OPTIONS,
  NUXT_I18N_TEMPLATE_OPTIONS_KEY,
  NUXT_I18N_COMPOSABLE_DEFINE_ROUTE,
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
  NUXT_I18N_COMPOSABLE_DEFINE_CONFIG,
  VUE_I18N_PKG
} from './constants'
import {
  formatMessage,
  getNormalizedLocales,
  resolveLocales,
  mergeI18nModules,
  applyOptionOverrides,
  getLocaleFiles,
  filterLocales
} from './utils'
import { distDir, runtimeDir } from './dirs'
import { applyLayerOptions, checkLayerOptions, resolveLayerVueI18nConfigInfo } from './layers'
import { generateTemplateNuxtI18nOptions } from './template'

import type { HookResult } from '@nuxt/schema'
import type { LocaleObject, NuxtI18nOptions } from './types'
import type { Locale } from 'vue-i18n'

export * from './types'

const debug = createDebug('@nuxtjs/i18n:module')

export default defineNuxtModule<NuxtI18nOptions>({
  meta: {
    name: NUXT_I18N_MODULE_ID,
    configKey: 'i18n',
    compatibility: {
      nuxt: '>=3.0.0-rc.11',
      bridge: false
    }
  },
  defaults: DEFAULT_OPTIONS,
  async setup(i18nOptions, nuxt) {
    const logger = useLogger(NUXT_I18N_MODULE_ID)

    const options = i18nOptions as Required<NuxtI18nOptions>
    applyOptionOverrides(options, nuxt)
    debug('options', options)

    /**
     * Check versions
     */

    checkLayerOptions(options, nuxt)

    if (isNuxt2(nuxt)) {
      throw new Error(
        formatMessage(
          `We will release >=7.3 <8, See about GitHub Discussions https://github.com/nuxt-community/i18n-module/discussions/1287#discussioncomment-3042457: ${getNuxtVersion(
            nuxt
          )}`
        )
      )
    }

    if (!isNuxt3(nuxt)) {
      throw new Error(formatMessage(`Cannot support nuxt version: ${getNuxtVersion(nuxt)}`))
    }

    /**
     * Check conflicting options
     */

    if (options.bundle.compositionOnly && options.types === 'legacy') {
      throw new Error(
        formatMessage(
          '`bundle.compositionOnly` option and `types` option is conflicting: ' +
            `bundle.compositionOnly: ${options.bundle.compositionOnly}, types: ${JSON.stringify(options.types)}`
        )
      )
    }

    if (options.dynamicRouteParams) {
      logger.warn(
        'The `dynamicRouteParams` options is deprecated and will be removed in `v9`, use the `useSetI18nParams` composable instead.'
      )
    }

    if (options.experimental.autoImportTranslationFunctions && nuxt.options.imports.autoImport === false) {
      logger.warn(
        'Disabling `autoImports` in Nuxt is not compatible with `experimental.autoImportTranslationFunctions`, either enable `autoImports` or disable `experimental.autoImportTranslationFunctions`.'
      )
    }

    if (nuxt.options.experimental.scanPageMeta === false) {
      logger.warn(
        "Route localization features (e.g. custom name, prefixed aliases) require Nuxt's `experimental.scanPageMeta` to be enabled.\nThis feature will be enabled in future Nuxt versions (https://github.com/nuxt/nuxt/pull/27134), check out the docs for more details: https://nuxt.com/docs/guide/going-further/experimental-features#scanpagemeta"
      )
    }

    /**
     * nuxt layers handling ...
     */

    applyLayerOptions(options, nuxt)
    await mergeI18nModules(options, nuxt)
    filterLocales(options, nuxt)

    /**
     * setup runtime config
     */

    // for public
    // @ts-expect-error generated type
    nuxt.options.runtimeConfig.public.i18n = defu(nuxt.options.runtimeConfig.public.i18n, {
      baseUrl: options.baseUrl,
      defaultLocale: options.defaultLocale,
      defaultDirection: options.defaultDirection,
      strategy: options.strategy,
      lazy: options.lazy,
      rootRedirect: options.rootRedirect,
      routesNameSeparator: options.routesNameSeparator,
      defaultLocaleRouteNameSuffix: options.defaultLocaleRouteNameSuffix,
      skipSettingLocaleOnNavigate: options.skipSettingLocaleOnNavigate,
      differentDomains: options.differentDomains,
      trailingSlash: options.trailingSlash,
      configLocales: options.locales,
      locales: options.locales.reduce(
        (obj, locale) => {
          if (typeof locale === 'string') {
            obj[locale] = { domain: undefined }
          } else {
            obj[locale.code] = { domain: locale.domain }
          }
          return obj
        },
        {} as Record<string, { domain: string | undefined }>
      ),
      detectBrowserLanguage: options.detectBrowserLanguage ?? DEFAULT_OPTIONS.detectBrowserLanguage,
      experimental: options.experimental
      // TODO: we should support more i18n module options. welcome PRs :-)
    })

    /**
     * resolve locale info
     */

    const normalizedLocales = getNormalizedLocales(options.locales)
    const localeCodes = normalizedLocales.map(locale => locale.code)
    const localeInfo = await resolveLocales(nuxt.options.srcDir, normalizedLocales, nuxt.options.buildDir)
    debug('localeInfo', localeInfo)

    /**
     * resolve vue-i18n config path
     */

    const vueI18nConfigPaths = await resolveLayerVueI18nConfigInfo(options)
    debug('VueI18nConfigPaths', vueI18nConfigPaths)

    /**
     * setup nuxt/pages
     */

    if (options.strategy !== 'no_prefix' && localeCodes.length) {
      setupPages(options, nuxt)
    }

    /**
     * ignore `/` during prerender when using prefixed routing
     */

    if (options.strategy === 'prefix' && nuxt.options._generate) {
      const localizedEntryPages = normalizedLocales.map(x => ['/', x.code].join(''))
      nuxt.hook('nitro:config', config => {
        config.prerender ??= {}

        // ignore `/` which is added by nitro by default
        config.prerender.ignore ??= []
        config.prerender.ignore.push(/^\/$/)

        // add localized routes as entry pages for prerendering
        config.prerender.routes ??= []
        config.prerender.routes.push(...localizedEntryPages)
      })
    }

    /**
     * setup module alias
     */

    await setupAlias(nuxt, options)

    /**
     * add plugin and templates
     */

    // for core plugin
    addPlugin(resolve(runtimeDir, 'plugins/i18n'))
    addPlugin(resolve(runtimeDir, 'plugins/switch-locale-path-ssr'))

    // for composables
    nuxt.options.alias['#i18n'] = resolve(distDir, 'runtime/composables/index.mjs')
    nuxt.options.build.transpile.push('#i18n')

    const genTemplate = (isServer: boolean, lazy?: boolean) => {
      const nuxtI18nOptions = defu({}, options)
      // override `lazy` options
      if (lazy != null) {
        nuxtI18nOptions.lazy = lazy
      }
      return generateTemplateNuxtI18nOptions({
        ...generateLoaderOptions(nuxt, {
          vueI18nConfigPaths,
          localeInfo,
          nuxtI18nOptions,
          isServer
        }),
        localeCodes,
        normalizedLocales,
        dev: nuxt.options.dev,
        isSSG: nuxt.options._generate,
        parallelPlugin: options.parallelPlugin
      })
    }

    // @ts-expect-error type error
    nuxt.options.runtimeConfig.public.i18n.configLocales = simplifyLocaleOptions(nuxt, defu({}, options))

    addTemplate({
      filename: NUXT_I18N_TEMPLATE_OPTIONS_KEY,
      write: true,
      getContents: () => genTemplate(false)
    })

    /**
     * `PageMeta` augmentation to add `nuxtI18n` property
     * TODO: Remove in v9, `useSetI18nParams` should be used instead
     */
    if (options.dynamicRouteParams) {
      addTypeTemplate({
        filename: 'types/i18n-page-meta.d.ts',
        getContents: () => generateI18nPageTypes()
      })
    }

    /**
     * `$i18n` type narrowing based on 'legacy' or 'composition'
     * `locales` type narrowing based on generated configuration
     */
    addTypeTemplate({
      filename: 'types/i18n-plugin.d.ts',
      getContents: () => generateI18nTypes(nuxt, i18nOptions)
    })

    /**
     * disable preloading/prefetching lazy loaded locales
     */
    nuxt.hook('build:manifest', manifest => {
      if (options.lazy) {
        const langFiles = localeInfo
          .flatMap(locale => getLocaleFiles(locale))
          .map(x => relative(nuxt.options.srcDir, x.path))
        const langPaths = [...new Set(langFiles)]

        for (const key in manifest) {
          if (langPaths.some(x => key.startsWith(x))) {
            manifest[key].prefetch = false
            manifest[key].preload = false
          }
        }
      }
    })

    /**
     * extend bundler
     */

    await extendBundler(nuxt, options)

    /**
     * setup nitro
     */

    await setupNitro(nuxt, options, {
      optionsCode: genTemplate(true, true),
      localeInfo
    })

    /**
     * auto imports
     */

    const vueI18nPath = nuxt.options.alias[VUE_I18N_PKG]
    debug('vueI18nPath for auto-import', vueI18nPath)

    await addComponent({
      name: 'NuxtLinkLocale',
      filePath: resolve(runtimeDir, 'components/NuxtLinkLocale')
    })

    await addComponent({
      name: 'SwitchLocalePathLink',
      filePath: resolve(runtimeDir, 'components/SwitchLocalePathLink')
    })

    addImports([
      { name: 'useI18n', from: vueI18nPath },
      ...[
        'useRouteBaseName',
        'useLocalePath',
        'useLocaleRoute',
        'useSwitchLocalePath',
        'useLocaleHead',
        'useBrowserLocale',
        'useCookieLocale',
        'useSetI18nParams',
        NUXT_I18N_COMPOSABLE_DEFINE_ROUTE,
        NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
        NUXT_I18N_COMPOSABLE_DEFINE_CONFIG
      ].map(key => ({
        name: key,
        as: key,
        from: resolve(runtimeDir, 'composables/index')
      }))
    ])

    /**
     * transpile @nuxtjs/i18n
     */

    // https://github.com/nuxt/framework/issues/5257
    nuxt.options.build.transpile.push('@nuxtjs/i18n')
    nuxt.options.build.transpile.push('@nuxtjs/i18n-edge')

    /**
     * Optimize deps
     */

    // Optimize vue-i18n to ensure we share the same symbol
    nuxt.options.vite.optimizeDeps = nuxt.options.vite.optimizeDeps || {}
    nuxt.options.vite.optimizeDeps.exclude = nuxt.options.vite.optimizeDeps.exclude || []
    nuxt.options.vite.optimizeDeps.exclude.push('vue-i18n')
  }
})

// Prevent type errors while configuring locale codes, as generated types will conflict with changes
type UserNuxtI18nOptions = Omit<NuxtI18nOptions, 'locales'> & { locales?: string[] | LocaleObject<string>[] }

// Used by nuxt/module-builder for `types.d.ts` generation
export interface ModuleOptions extends UserNuxtI18nOptions {}

export interface ModulePublicRuntimeConfig {
  i18n: {
    baseUrl: NuxtI18nOptions['baseUrl']
    rootRedirect: NuxtI18nOptions['rootRedirect']

    /**
     * Overwritten at build time, used to pass generated options to runtime
     *
     * @internal
     */
    experimental: NonNullable<NuxtI18nOptions['experimental']>
    /**
     * Overwritten at build time, used to pass generated options to runtime
     *
     * @internal
     */
    configLocales: NonNullable<Required<NuxtI18nOptions<unknown>>['locales']>
    /**
     * Overwritten at build time, used to pass generated options to runtime
     *
     * @internal
     */
    differentDomains: Required<NuxtI18nOptions>['differentDomains']
    /**
     * Overwritten at build time, used to pass generated options to runtime
     *
     * @internal
     */
    skipSettingLocaleOnNavigate: Required<NuxtI18nOptions>['skipSettingLocaleOnNavigate']
    /**
     * Overwritten at build time, used to pass generated options to runtime
     *
     * @internal
     */
    defaultLocale: Required<NuxtI18nOptions>['defaultLocale']
    /**
     * Overwritten at build time, used to pass generated options to runtime
     *
     * @internal
     */
    lazy: Required<NuxtI18nOptions>['lazy']
    /**
     * Overwritten at build time, used to pass generated options to runtime
     *
     * @internal
     */
    defaultDirection: Required<NuxtI18nOptions>['defaultDirection']
    /**
     * Overwritten at build time, used to pass generated options to runtime
     *
     * @internal
     */
    detectBrowserLanguage: Required<NuxtI18nOptions>['detectBrowserLanguage']
    /**
     * Overwritten at build time, used to pass generated options to runtime
     *
     * @internal
     */
    strategy: Required<NuxtI18nOptions>['strategy']
    /**
     * Overwritten at build time, used to pass generated options to runtime
     *
     * @internal
     */
    routesNameSeparator: Required<NuxtI18nOptions>['routesNameSeparator']
    /**
     * Overwritten at build time, used to pass generated options to runtime
     *
     * @internal
     */
    defaultLocaleRouteNameSuffix: Required<NuxtI18nOptions>['defaultLocaleRouteNameSuffix']
    /**
     * Overwritten at build time, used to pass generated options to runtime
     *
     * @internal
     */
    trailingSlash: Required<NuxtI18nOptions>['trailingSlash']
  }
}
export interface ModuleHooks {
  'i18n:registerModule': (
    registerModule: (config: Pick<NuxtI18nOptions<unknown>, 'langDir' | 'locales'>) => void
  ) => HookResult
}

export interface ModuleRuntimeHooks {
  // NOTE: To make type inference work the function signature returns `HookResult`
  // Should return `string | void`
  'i18n:beforeLocaleSwitch': <Context = unknown>(params: {
    oldLocale: Locale
    newLocale: Locale
    initialSetup: boolean
    context: Context
  }) => HookResult

  'i18n:localeSwitched': (params: { oldLocale: Locale; newLocale: Locale }) => HookResult
}

// Used by module for type inference in source code
declare module '#app' {
  interface RuntimeNuxtHooks extends ModuleRuntimeHooks {}
}

declare module '@nuxt/schema' {
  interface NuxtConfig {
    ['i18n']?: Partial<UserNuxtI18nOptions>
  }
  interface NuxtOptions {
    ['i18n']?: UserNuxtI18nOptions
  }
  interface NuxtHooks extends ModuleHooks {}
  interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {}
}
