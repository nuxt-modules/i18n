import { defineNuxtModule, addTypeTemplate } from '@nuxt/kit'
import { relative } from 'pathe'
import { setupAlias } from './alias'
import { setupPages } from './pages'
import { setupNitro } from './nitro'
import { extendBundler } from './bundler'
import { generateI18nTypes } from './gen'
import { NUXT_I18N_MODULE_ID, DEFAULT_OPTIONS } from './constants'
import { mergeI18nModules, getLocaleFiles, filterLocales } from './utils'
import { applyLayerOptions } from './layers'
import { i18nVirtualLoggerPlugin, RESOLVED_VIRTUAL_NUXT_I18N_LOGGER } from './virtual-logger'
import type { HookResult } from '@nuxt/schema'
import type { LocaleObject, NuxtI18nOptions } from './types'
import type { Locale } from 'vue-i18n'
import { createContext } from './context'
import { prepareOptions } from './prepare-options'
import { resolveLocaleInfo } from './resolve-locale-info'
import { prepareRuntime } from './prepare-runtime'
import { prepareRuntimeConfig } from './prepare-runtime-config'
import { prepareAutoImports } from './prepare-auto-imports'

export * from './types'

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
    const ctx = createContext(i18nOptions, nuxt)

    const { isSSG, options } = ctx

    /**
     * Prepare options
     */
    prepareOptions(ctx, nuxt)

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
    prepareRuntimeConfig(ctx, nuxt)

    /**
     * resolve locale info and vue-i18n config path
     */
    await resolveLocaleInfo(ctx, nuxt)

    const { normalizedLocales, localeInfo, localeCodes } = ctx

    /**
     * setup nuxt/pages
     */
    if (localeCodes.length) {
      setupPages(ctx, nuxt)
    }

    /**
     * ignore `/` during prerender when using prefixed routing
     */
    if (options.strategy === 'prefix' && isSSG) {
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
    await setupAlias(ctx, nuxt)

    /**
     * add plugin and templates
     */
    prepareRuntime(ctx, nuxt)

    nuxt.options.imports.transform ??= {}
    nuxt.options.imports.transform.include ??= []
    nuxt.options.imports.transform.include.push(new RegExp(`${RESOLVED_VIRTUAL_NUXT_I18N_LOGGER}$`))

    nuxt.hook('vite:extendConfig', cfg => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      cfg.plugins ||= []
      // @ts-ignore NOTE: A type error occurs due to a mismatch between Vite plugins and those of Rollup
      cfg.plugins.push(i18nVirtualLoggerPlugin(options.debug))
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

    await setupNitro(ctx, nuxt, {
      optionsCode: ctx.genTemplate(true, true),
      localeInfo
    })

    /**
     * auto imports
     */
    await prepareAutoImports(ctx, nuxt)

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
    multiDomainLocales?: NuxtI18nOptions['multiDomainLocales']

    /**
     * Overwritten at build time, used to pass generated options to runtime
     *
     * @internal
     */
    domainLocales: { [key: Locale]: { domain: string | undefined } }

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
    locales: NonNullable<Required<NuxtI18nOptions<unknown>>['locales']>
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
    ['i18n']: UserNuxtI18nOptions
  }
  interface NuxtHooks extends ModuleHooks {}
  interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {}
}
