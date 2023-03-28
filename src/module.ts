import createDebug from 'debug'
import { promises as fs } from 'node:fs'
import { isBoolean, isObject, isString } from '@intlify/shared'
import {
  defineNuxtModule,
  isNuxt2,
  isNuxt3,
  getNuxtVersion,
  addPlugin,
  addTemplate,
  addImports,
  addServerHandler,
  useLogger,
  addPrerenderRoutes // TODO: remove?
} from '@nuxt/kit'
import { resolve, relative, isAbsolute } from 'pathe'
import { defu } from 'defu'
import { setupAlias, resolveVueI18nAlias } from './alias'
import { setupPages } from './pages'
import { extendMessages } from './messages'
import { extendBundler } from './bundler'
import { generateLoaderOptions } from './gen'
import {
  NUXT_I18N_MODULE_ID,
  DEFAULT_OPTIONS,
  NUXT_I18N_TEMPLATE_OPTIONS_KEY,
  NUXT_I18N_PRECOMPILE_ENDPOINT,
  NUXT_I18N_PRECOMPILED_LOCALE_KEY,
  NUXT_I18N_COMPOSABLE_DEFINE_ROUTE,
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE
} from './constants'
import { formatMessage, getNormalizedLocales, resolveLocales, getPackageManagerType, mergeI18nModules } from './utils'
import { distDir, runtimeDir, pkgModulesDir } from './dirs'
import { applyLayerOptions } from './layers'

import type { NuxtI18nOptions } from './types'
import type { DefineLocaleMessage, LocaleMessages } from 'vue-i18n'

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
    debug('options', options)

    if (options.experimental.jsTsFormatResource) {
      logger.warn(formatMessage('JS / TS extension format is experimental'))
    }

    /**
     * Check vertions
     */

    checkOptions(options)

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

    await mergeI18nModules(options, nuxt)
    applyLayerOptions(options, nuxt)

    if (options.strategy === 'no_prefix' && options.differentDomains) {
      console.warn(
        formatMessage(
          'The `differentDomains` option and `no_prefix` strategy are not compatible. Change strategy or disable `differentDomains` option.'
        )
      )
    }

    /**
     * setup runtime config
     */

    nuxt.options.runtimeConfig.public.i18n = defu(nuxt.options.runtimeConfig.public.i18n, {
      experimental: options.experimental,
      baseUrl: options.baseUrl
      // TODO: we should support more i18n module options. welcome PRs :-)
    })

    nuxt.options.runtimeConfig.i18n = defu(nuxt.options.runtimeConfig.i18n, {
      precompile: options.precompile
    })

    /**
     * resolve lang directory
     */

    if (isString(options.langDir) && isAbsolute(options.langDir)) {
      console.warn(
        formatMessage(
          `\`langdir\` is set to an absolute path (${options.langDir}) but should be set a path relative to \`srcDir\` (${nuxt.options.srcDir}). Absolute paths will not work in production, see https://v8.i18n.nuxtjs.org/options/lazy#langdir for more details.`
        )
      )
    }
    const langPath = isString(options.langDir) ? resolve(nuxt.options.srcDir, options.langDir) : null
    debug('langDir path', langPath)

    /**
     * resolve locale info
     */

    const normalizedLocales = getNormalizedLocales(options.locales)
    const hasLocaleFiles = normalizedLocales.length > 0
    const localeCodes = normalizedLocales.map(locale => locale.code)
    const localeInfo = langPath != null ? await resolveLocales(langPath, normalizedLocales) : []
    debug('localeInfo', localeInfo)

    /**
     * resolve vue-i18n options
     */

    // prettier-ignore
    options.vueI18n = isObject(options.vueI18n)
      ? options.vueI18n
      : isString(options.vueI18n)
        ? resolve(nuxt.options.rootDir, options.vueI18n)
        : { legacy: false }

    /**
     * extend messages via 3rd party nuxt modules
     */

    const additionalMessages = await extendMessages(nuxt, localeCodes, options)

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
          options.langDir,
          localesRelativeBasePath,
          {
            localeCodes,
            localeInfo,
            additionalMessages,
            nuxtI18nOptions: options,
            nuxtI18nOptionsDefault: DEFAULT_OPTIONS,
            nuxtI18nInternalOptions: {
              __normalizedLocales: normalizedLocales
            }
          },
          {
            ssg: nuxt.options._generate,
            ssr: nuxt.options.ssr,
            dev: nuxt.options.dev
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

    // prettier-ignore
    const isLegacyMode = () => {
      return isString(options.types)
        ? options.types === 'legacy'
        : isObject(options.vueI18n) && isBoolean(options.vueI18n.legacy)
          ? options.vueI18n.legacy
          : false
    }

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
      hasLocaleFiles,
      langPath
    })

    /**
     * extend server handlers
     */

    addServerHandler({
      route: NUXT_I18N_PRECOMPILE_ENDPOINT,
      handler: resolve(runtimeDir, './server/precompile')
    })

    // NOTE: Maybe, there is a better way to pre-compile resources using prerender...
    // addPrerenderRoutes([NUXT_I18N_PRECOMPILE_ENDPOINT])

    /**
     * extend nitro storages
     */

    const storageKey = NUXT_I18N_PRECOMPILED_LOCALE_KEY.split('-').join(':')
    nuxt.hook('nitro:config', nitro => {
      nitro.storage = nitro.storage || {}
      nitro.storage[storageKey] = {
        // nitro.devStorage = nitro.devStorage || {}
        // nitro.devStorage['i18n:locales'] = {
        driver: 'fs',
        base: resolve(nuxt.options.buildDir, NUXT_I18N_PRECOMPILED_LOCALE_KEY)
      }
      // NOTE: Maybe, there is a better way to pre-compile resources using prerender...
      // nitro.bundledStorage = nitro.bundledStorage || []
      // nitro.bundledStorage.push('/i18n/locales')
    })

    /**
     * copy pre-compiled locale resources to `public` dir from `.nuxt/i18n-locale`
     *
     * NOTE:
     *  There has to be a smart way to do this, one that is nitro.
     *  (maybe, I think that is prerender)
     */

    if (nuxt.options._generate) {
      nuxt.hook('nitro:build:before', async nitro => {
        const buildLocaleDir = nitro.options.storage[storageKey].base
        await nitro.storage.watch(async (event, key) => {
          if (event === 'update') {
            const buildKey = `build:${NUXT_I18N_PRECOMPILED_LOCALE_KEY}`
            if (key.startsWith(buildKey)) {
              const locale = key.split(':')[2]
              const source = resolve(buildLocaleDir, locale)
              const target = resolve(nitro.options.output.publicDir, `${NUXT_I18N_PRECOMPILED_LOCALE_KEY}-${locale}`)
              const localeCode = await fs.readFile(source, 'utf-8')
              await fs.writeFile(target, localeCode, 'utf-8')
              debug(`generate locale file: ${source} -> ${target}`)
            }
          }
        })
      })
    }

    /**
     * auto imports
     */

    const pkgMgr = await getPackageManagerType()
    const vueI18nPath = await resolveVueI18nAlias(pkgModulesDir, nuxt, pkgMgr)
    debug('vueI18nPath for auto-import', vueI18nPath)

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
        NUXT_I18N_COMPOSABLE_DEFINE_LOCALE
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

function checkOptions(options: NuxtI18nOptions) {
  // check `lazy` and `langDir` option
  if (options.lazy && !options.langDir) {
    throw new Error(formatMessage('When using the "lazy" option you must also set the "langDir" option.'))
  }

  // check `langDir` option
  if (options.langDir) {
    const locales = options.locales || []
    if (!locales.length || isString(locales[0])) {
      throw new Error(formatMessage('When using the "langDir" option the "locales" must be a list of objects.'))
    }
    for (const locale of locales) {
      if (isString(locale) || !(locale.file || locale.files)) {
        throw new Error(
          formatMessage(
            `All locales must be objects and have the "file" or "files" property set when using "langDir".\nFound none in:\n${JSON.stringify(
              locale,
              null,
              2
            )}.`
          )
        )
      }
    }
  }
}

type MaybePromise<T> = T | Promise<T>
type LocaleSwitch<T extends string = string> = { oldLocale: T; newLocale: T }

type ModulePublicRuntimeConfig<Context = unknown> = Pick<NuxtI18nOptions<Context>, 'baseUrl' | 'experimental'>
type ModulePrivateRuntimeConfig<Context = unknown> = Pick<NuxtI18nOptions<Context>, 'precompile'>

declare module '@nuxt/schema' {
  interface NuxtConfig {
    i18n?: NuxtI18nOptions
  }

  interface NuxtHooks {
    'i18n:extend-messages': (messages: LocaleMessages<DefineLocaleMessage>[], localeCodes: string[]) => Promise<void>
    'i18n:registerModule': (config: Pick<NuxtI18nOptions, 'langDir' | 'locales'>) => Promise<void>
  }

  interface ConfigSchema {
    runtimeConfig: {
      public?: {
        i18n?: ModulePublicRuntimeConfig
      }
      private?: {
        i18n?: ModulePrivateRuntimeConfig
      }
    }
  }
}

declare module '#app' {
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
