import createDebug from 'debug'
import { isObject } from '@intlify/shared'
import {
  defineNuxtModule,
  isNuxt2,
  isNuxt3,
  getNuxtVersion,
  addComponent,
  addPlugin,
  addTemplate,
  addImports,
  useLogger
} from '@nuxt/kit'
import { resolve, relative } from 'pathe'
import { defu } from 'defu'
import { setupAlias, resolveVueI18nAlias } from './alias'
import { setupPages } from './pages'
import { setupNitro } from './nitro'
import { extendBundler } from './bundler'
import { generateLoaderOptions } from './gen'
import {
  NUXT_I18N_MODULE_ID,
  DEFAULT_OPTIONS,
  NUXT_I18N_TEMPLATE_OPTIONS_KEY,
  NUXT_I18N_COMPOSABLE_DEFINE_ROUTE,
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
  NUXT_I18N_COMPOSABLE_DEFINE_CONFIG
} from './constants'
import {
  formatMessage,
  getNormalizedLocales,
  resolveLocales,
  getPackageManagerType,
  mergeI18nModules,
  resolveVueI18nConfigInfo,
  applyOptionOverrides
} from './utils'
import { distDir, runtimeDir, pkgModulesDir } from './dirs'
import { applyLayerOptions, checkLayerOptions, resolveLayerVueI18nConfigInfo } from './layers'

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

    if (options.experimental.jsTsFormatResource) {
      logger.warn('JS / TS extension format is experimental')
    }

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

    applyLayerOptions(options, nuxt)
    await mergeI18nModules(options, nuxt)

    if (options.strategy === 'no_prefix' && options.differentDomains) {
      console.warn(
        formatMessage(
          'The `differentDomains` option and `no_prefix` strategy are not compatible. ' +
            'Change strategy or disable `differentDomains` option.'
        )
      )
    }

    /**
     * setup runtime config
     */

    // for public
    nuxt.options.runtimeConfig.public.i18n = defu(nuxt.options.runtimeConfig.public.i18n, {
      experimental: options.experimental,
      baseUrl: options.baseUrl
      // TODO: we should support more i18n module options. welcome PRs :-)
    })

    /**
     * resolve locale info
     */

    const normalizedLocales = getNormalizedLocales(options.locales)
    const hasLocaleFiles = normalizedLocales.length > 0
    const localeCodes = normalizedLocales.map(locale => locale.code)
    const localeInfo = await resolveLocales(resolve(nuxt.options.srcDir), normalizedLocales)
    debug('localeInfo', localeInfo)

    /**
     * resolve vue-i18n config path
     */

    // TODO: remove before v8 official release
    if (isObject(options.vueI18n)) {
      throw new Error(
        formatMessage(
          'The `vueI18n` option is no longer be specified with object. ' +
            '\n' +
            `It must be specified in the configuration file via the 'i18n.config' path.` +
            '\n' +
            `About deprecated reason, see https://v8.i18n.nuxtjs.org/guide/migrating#change-the-route-key-rules-in-pages-option` +
            '\n' +
            `About new configuration style, see https://v8.i18n.nuxtjs.org/getting-started/basic-usage#translate-with-vue-i18n`
        )
      )
    }

    const vueI18nConfigPathInfo = await resolveVueI18nConfigInfo(options, nuxt.options.buildDir, nuxt.options.rootDir)
    if (vueI18nConfigPathInfo.absolute == null) {
      logger.warn(`Vue I18n configuration file does not exist at ${vueI18nConfigPathInfo.relative}. Skipping...`)
    }
    debug('vueI18nConfigPathInfo', vueI18nConfigPathInfo)

    const layerVueI18nConfigPaths = await resolveLayerVueI18nConfigInfo(nuxt, nuxt.options.buildDir)
    for (const vueI18nConfigPath of layerVueI18nConfigPaths) {
      if (vueI18nConfigPath.absolute == null) {
        logger.warn(
          `Ignore Vue I18n configuration file does not exist at ${vueI18nConfigPath.relative} on layer ${vueI18nConfigPath.rootDir}. Skipping...`
        )
      }
    }
    debug('layerVueI18nConfigPaths', layerVueI18nConfigPaths)

    /**
     * setup nuxt/pages
     */

    if (options.strategy !== 'no_prefix' && localeCodes.length) {
      await setupPages(options, nuxt, { trailingSlash: options.trailingSlash })
    }

    /**
     * setup module alias
     */

    await setupAlias(nuxt)

    /**
     * add plugin and templates
     */

    // for core plugin
    addPlugin(resolve(runtimeDir, 'plugins/i18n'))

    // for compoables
    nuxt.options.alias['#i18n'] = resolve(distDir, 'runtime/composables.mjs')
    nuxt.options.build.transpile.push('#i18n')

    // TODO: We don't want to resolve the following as a template,
    //  but in the runtime dir we want to use as an ESM (e.g. internal and utils)

    // for internal
    addTemplate({
      filename: 'i18n.internal.mjs',
      src: resolve(distDir, 'runtime/internal.mjs')
    })

    // for utils
    addTemplate({
      filename: 'i18n.utils.mjs',
      src: resolve(distDir, 'runtime/utils.mjs')
    })

    // for loading options
    const localesRelativeBasePath = relative(nuxt.options.buildDir, nuxt.options.srcDir)
    debug('localesRelativeBasePath', localesRelativeBasePath)

    addTemplate({
      filename: NUXT_I18N_TEMPLATE_OPTIONS_KEY,
      write: true,
      getContents: () => {
        return generateLoaderOptions(
          options.lazy,
          localesRelativeBasePath,
          vueI18nConfigPathInfo,
          layerVueI18nConfigPaths,
          {
            localeCodes,
            localeInfo,
            nuxtI18nOptions: options,
            nuxtI18nOptionsDefault: DEFAULT_OPTIONS,
            nuxtI18nInternalOptions: {
              __normalizedLocales: normalizedLocales
            }
          },
          {
            ssg: nuxt.options._generate,
            dev: nuxt.options.dev,
            parallelPlugin: i18nOptions.parallelPlugin ?? false
          }
        )
      }
    })

    /**
     * To be plugged for `PageMeta` type definition on `NuxtApp`
     */

    if (!!options.dynamicRouteParams) {
      addPlugin(resolve(runtimeDir, 'plugins/meta'))
    }

    /**
     * add extend type definition
     */

    const isLegacyMode = () => options.types === 'legacy'

    // To be plugged for `$i18n` type definition on `NuxtApp`
    addPlugin(resolve(runtimeDir, isLegacyMode() ? 'plugins/legacy' : 'plugins/composition'))

    nuxt.hook('prepare:types', ({ references }) => {
      const vueI18nTypeFilename = resolve(runtimeDir, 'types')
      references.push({ path: resolve(nuxt.options.buildDir, vueI18nTypeFilename) })
    })

    /**
     * extend bundler
     */

    await extendBundler(nuxt, {
      nuxtOptions: options as Required<NuxtI18nOptions>,
      hasLocaleFiles
    })

    /**
     * setup nitro
     */

    await setupNitro(nuxt, options)

    /**
     * auto imports
     */

    const pkgMgr = await getPackageManagerType()
    const vueI18nPath = await resolveVueI18nAlias(pkgModulesDir, nuxt, pkgMgr)
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
        NUXT_I18N_COMPOSABLE_DEFINE_ROUTE,
        NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
        NUXT_I18N_COMPOSABLE_DEFINE_CONFIG
      ].map(key => ({
        name: key,
        as: key,
        from: resolve(runtimeDir, 'composables')
      }))
    ])

    /**
     * transpile @nuxtjs/i18n
     */

    // https://github.com/nuxt/framework/issues/5257
    nuxt.options.build.transpile.push('@nuxtjs/i18n')
    nuxt.options.build.transpile.push('@nuxtjs/i18n-edge')

    /**
     * Optimiaztion deps
     */

    // Optimize vue-i18n to ensure we share the same symbol
    nuxt.options.vite.optimizeDeps = nuxt.options.vite.optimizeDeps || {}
    nuxt.options.vite.optimizeDeps.exclude = nuxt.options.vite.optimizeDeps.exclude || []
    nuxt.options.vite.optimizeDeps.exclude.push('vue-i18n')
  }
})

type MaybePromise<T> = T | Promise<T>
type LocaleSwitch<T extends string = string> = { oldLocale: T; newLocale: T }

type ModulePublicRuntimeConfig<Context = unknown> = Pick<NuxtI18nOptions<Context>, 'baseUrl' | 'experimental'>

declare module '@nuxt/schema' {
  interface NuxtConfig {
    i18n?: NuxtI18nOptions
  }

  interface NuxtHooks {
    'i18n:registerModule': (registerModule: (config: Pick<NuxtI18nOptions, 'langDir' | 'locales'>) => void) => void
  }

  interface PublicRuntimeConfig {
    i18n?: ModulePublicRuntimeConfig
  }
}

declare module '#app/nuxt' {
  interface RuntimeNuxtHooks {
    'i18n:beforeLocaleSwitch': <Context = unknown>(
      params: LocaleSwitch & {
        initialSetup: boolean
        context: Context
      }
    ) => MaybePromise<void>
    'i18n:localeSwitched': (params: LocaleSwitch) => MaybePromise<void>
  }
}
