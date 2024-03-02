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
import { generateI18nTypes, generateLoaderOptions } from './gen'
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
import type { NuxtI18nOptions } from './types'

export * from './types'

const debug = createDebug('@nuxtjs/i18n:module')

export default defineNuxtModule<NuxtI18nOptions>({
  meta: {
    name: NUXT_I18N_MODULE_ID,
    configKey: 'i18n',
    compatibility: {
      nuxt: '^3.0.0-rc.11',
      bridge: false
    }
  },
  defaults: DEFAULT_OPTIONS,
  async setup(i18nOptions, nuxt) {
    const logger = useLogger(NUXT_I18N_MODULE_ID)

    const options = i18nOptions as Required<NuxtI18nOptions>
    applyOptionOverrides(options, nuxt)
    debug('options', options)

    if (!options.compilation.jit) {
      logger.warn(
        'Opt-out JIT compilation. ' +
          `It's necessary to pre-compile locale messages that are not managed by the nuxt i18n module (e.g. in the case of importing from a specific URL, you will need to precompile them yourself.) ` +
          `And also, you need to understand that you cannot support use cases where you dynamically compose locale messages from the back-end via an API.`
      )
    }

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

    if (options.bundle.runtimeOnly && options.compilation.jit) {
      logger.warn(
        '`bundle.runtimeOnly` option and `compilation.jit` option is conflicting: ' +
          `bundle.runtimeOnly: ${options.bundle.runtimeOnly}, compilation.jit: ${JSON.stringify(
            options.compilation.jit
          )}`
      )
    }

    if (options.strategy === 'no_prefix' && options.differentDomains) {
      logger.warn(
        '`differentDomains` option and `no_prefix` strategy are not compatible. ' +
          'Change strategy or disable `differentDomains` option.'
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
    nuxt.options.runtimeConfig.public.i18n = defu(nuxt.options.runtimeConfig.public.i18n, {
      baseUrl: options.baseUrl,
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
      )
      // TODO: we should support more i18n module options. welcome PRs :-)
    })

    /**
     * resolve locale info
     */

    const normalizedLocales = getNormalizedLocales(options.locales)
    const localeCodes = normalizedLocales.map(locale => locale.code)
    const localeInfo = await resolveLocales(
      resolve(nuxt.options.srcDir),
      normalizedLocales,
      relative(nuxt.options.buildDir, nuxt.options.srcDir)
    )
    debug('localeInfo', localeInfo)

    /**
     * resolve vue-i18n config path
     */

    const vueI18nConfigPaths = await resolveLayerVueI18nConfigInfo(nuxt, nuxt.options.buildDir)
    debug('VueI18nConfigPaths', vueI18nConfigPaths)

    /**
     * setup nuxt/pages
     */

    if (options.strategy !== 'no_prefix' && localeCodes.length) {
      await setupPages(options, nuxt)
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

    addTemplate({
      filename: NUXT_I18N_TEMPLATE_OPTIONS_KEY,
      write: true,
      getContents: () => genTemplate(false)
    })

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
        const langFiles = localeInfo.flatMap(locale => getLocaleFiles(locale)).map(x => x.path)
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

    await extendBundler(nuxt, options as Required<NuxtI18nOptions>)

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

    await addImports([
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

// Used by nuxt/module-builder for `types.d.ts` generation
export interface ModuleOptions extends NuxtI18nOptions {}

export interface ModulePublicRuntimeConfig {
  i18n?: Pick<NuxtI18nOptions<unknown>, 'baseUrl'>
}

export interface ModuleHooks {
  'i18n:registerModule': (
    registerModule: (config: Pick<NuxtI18nOptions<unknown>, 'langDir' | 'locales'>) => void
  ) => HookResult
}

export interface RuntimeModuleHooks {
  // NOTE: To make type inference work the function signature returns `HookResult`
  // Should return `string | void`
  'i18n:beforeLocaleSwitch': <Context = unknown>(params: {
    oldLocale: string
    newLocale: string
    initialSetup: boolean
    context: Context
  }) => HookResult

  'i18n:localeSwitched': (params: { oldLocale: string; newLocale: string }) => HookResult
}

// Used by module for type inference in source code
declare module '#app' {
  interface RuntimeNuxtHooks extends RuntimeModuleHooks {}
}

declare module '@nuxt/schema' {
  interface NuxtConfig {
    ['i18n']?: Partial<ModuleOptions>
  }
  interface NuxtOptions {
    ['i18n']?: ModuleOptions
  }
  interface NuxtHooks extends ModuleHooks {}
  interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {}
}
