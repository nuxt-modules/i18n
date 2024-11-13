import { defineNuxtModule } from '@nuxt/kit'
import { setupAlias } from './alias'
import { setupPages } from './pages'
import { setupNitro } from './nitro'
import { extendBundler } from './bundler'
import { NUXT_I18N_MODULE_ID, DEFAULT_OPTIONS } from './constants'
import type { HookResult } from '@nuxt/schema'
import type { I18nPublicRuntimeConfig, LocaleObject, NuxtI18nOptions } from './types'
import type { Locale } from 'vue-i18n'
import { createContext } from './context'
import { prepareOptions } from './prepare/options'
import { resolveLocaleInfo } from './prepare/locale-info'
import { prepareRuntime } from './prepare/runtime'
import { prepareRuntimeConfig } from './prepare/runtime-config'
import { prepareAutoImports } from './prepare/auto-imports'
import { prepareBuildManifest } from './prepare/build-manifest'
import { prepareStrategy } from './prepare/strategy'
import { prepareLayers } from './prepare/layers'
import { prepareTranspile } from './prepare/transpile'
import { prepareVite } from './prepare/vite'
import { prepareTypeGeneration } from './prepare/type-generation'

export {
  type BaseUrlResolveHandler,
  type BundleOptions,
  type ComputedRouteOptions,
  type CustomBlocksOptions,
  type CustomRoutePages,
  type DetectBrowserLanguageOptions,
  type Directions,
  type ExperimentalFeatures,
  type FileMeta,
  type I18nHeadMetaInfo,
  type I18nHeadOptions,
  type I18nPublicRuntimeConfig,
  type LocaleFile,
  type LocaleInfo,
  type LocaleMessageCompilationOptions,
  type LocaleObject,
  type LocaleType,
  type MetaAttrs,
  type NuxtI18nOptions,
  type PrefixLocalizedRouteOptions,
  type PrefixableOptions,
  type RedirectOnOptions,
  type RootRedirectOptions,
  type RouteOptionsResolver,
  type STRATEGIES,
  type STRATEGY_NO_PREFIX,
  type STRATEGY_PREFIX,
  type STRATEGY_PREFIX_AND_DEFAULT,
  type STRATEGY_PREFIX_EXCEPT_DEFAULT,
  type SeoAttributesOptions,
  type Strategies,
  type SwitchLocalePathIntercepter,
  type VueI18nConfig,
  type VueI18nConfigPathInfo
} from './types'

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

    /**
     * Prepare options
     */
    prepareOptions(ctx, nuxt)

    /**
     * nuxt layers handling ...
     */
    await prepareLayers(ctx, nuxt)

    /**
     * setup runtime config
     */
    // for public
    prepareRuntimeConfig(ctx, nuxt)

    /**
     * resolve locale info and vue-i18n config path
     */
    await resolveLocaleInfo(ctx, nuxt)

    /**
     * setup nuxt/pages
     */
    await setupPages(ctx, nuxt)

    /**
     * ignore `/` during prerender when using prefixed routing
     */
    prepareStrategy(ctx, nuxt)

    /**
     * setup module alias
     */
    await setupAlias(ctx, nuxt)

    /**
     * add plugin and templates
     */
    prepareRuntime(ctx, nuxt)

    /**
     * generate vue-i18n and messages types using runtime server endpoint
     */
    prepareTypeGeneration(ctx, nuxt)

    /**
     * disable preloading/prefetching lazy loaded locales
     */
    prepareBuildManifest(ctx, nuxt)

    /**
     * extend bundler
     */

    await extendBundler(ctx, nuxt)

    /**
     * setup nitro
     */

    await setupNitro(ctx, nuxt)

    /**
     * auto imports
     */
    await prepareAutoImports(ctx, nuxt)

    /**
     * transpile @nuxtjs/i18n
     */
    prepareTranspile(nuxt)

    /**
     * Optimize deps
     */
    prepareVite(nuxt)
  }
})

// Prevent type errors while configuring locale codes, as generated types will conflict with changes
type UserNuxtI18nOptions = Omit<NuxtI18nOptions, 'locales'> & { locales?: string[] | LocaleObject<string>[] }

// Used by nuxt/module-builder for `types.d.ts` generation
export interface ModuleOptions extends UserNuxtI18nOptions {}

export interface ModulePublicRuntimeConfig {
  i18n: I18nPublicRuntimeConfig
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
