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
import { prepareTypeGeneration } from './prepare/type-generation'

export * from './types'

export default defineNuxtModule<NuxtI18nOptions>({
  meta: {
    name: NUXT_I18N_MODULE_ID,
    configKey: 'i18n',
    compatibility: {
      nuxt: '>=3.0.0-rc.11',
      // @ts-ignore property removed in Nuxt 4
      bridge: false
    }
  },
  defaults: DEFAULT_OPTIONS,
  async setup(i18nOptions, nuxt) {
    const ctx = createContext(i18nOptions)

    /**
     * prepare options
     */
    prepareOptions(ctx, nuxt)

    /**
     * auto imports
     */
    prepareAutoImports(ctx)

    /**
     * setup module alias
     */
    setupAlias(ctx, nuxt)

    /**
     * transpile @nuxtjs/i18n
     */
    nuxt.options.build.transpile.push('@nuxtjs/i18n')
    nuxt.options.build.transpile.push('@nuxtjs/i18n-edge')

    /**
     * optimize vue-i18n to ensure we share the same symbol
     */
    nuxt.options.vite.optimizeDeps ||= {}
    nuxt.options.vite.optimizeDeps.exclude ||= []
    nuxt.options.vite.optimizeDeps.exclude.push('vue-i18n')

    /**
     * add plugin and templates
     */
    prepareRuntime(ctx, nuxt)

    /**
     * generate vue-i18n and messages types using runtime server endpoint
     */
    await prepareTypeGeneration(ctx, nuxt)

    /**
     * allow other modules to register i18n hooks, then merge locales
     */
    nuxt.hook('modules:done', async () => {
      /**
       * resolve locale info and vue-i18n config path
       */
      await resolveLocaleInfo(ctx, nuxt)

      /**
       * setup runtime config
       */
      prepareRuntimeConfig(ctx, nuxt)

      /**
       * setup nuxt pages
       */
      await setupPages(ctx, nuxt)

      /**
       * ignore `/` during prerender when using prefixed routing
       */
      prepareStrategy(ctx, nuxt)

      /**
       * disable preloading/prefetching of locale files
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
    })
  }
})

// Prevent type errors while configuring locale codes, as generated types will conflict with changes
type UserNuxtI18nOptions = Omit<NuxtI18nOptions, 'locales'> & { locales?: string[] | LocaleObject<string>[] }

// Used by nuxt/module-builder for `types.d.ts` generation
export interface ModuleOptions extends UserNuxtI18nOptions {}

export interface ModulePublicRuntimeConfig {
  i18n: Partial<I18nPublicRuntimeConfig>
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
    /** @deprecated use `const context = useNuxtApp()` outside hook scope instead */
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
