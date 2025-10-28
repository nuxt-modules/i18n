import { addComponent, addImports, addImportsSources, defineNuxtModule, resolveModule } from '@nuxt/kit'
import { setupPages } from './pages'
import { setupNitro } from './nitro'
import { extendBundler } from './bundler'
import { DEFAULT_OPTIONS, DEFINE_I18N_CONFIG_FN, DEFINE_I18N_LOCALE_FN, DEFINE_I18N_ROUTE_FN } from './constants'
import type { HookResult } from '@nuxt/schema'
import type { I18nPublicRuntimeConfig, LocaleObject, NuxtI18nOptions } from './types'
import type { Locale } from 'vue-i18n'
import { createContext } from './context'
import { prepareOptions } from './prepare/options'
import { resolveLocaleInfo } from './prepare/locale-info'
import { prepareRuntime } from './prepare/runtime'
import { prepareRuntimeConfig } from './prepare/runtime-config'
import { prepareBuildManifest } from './prepare/build-manifest'
import { prepareStrategy } from './prepare/strategy'
import { prepareTypeGeneration } from './prepare/type-generation'
import { relative } from 'pathe'

export * from './types'

export default defineNuxtModule<NuxtI18nOptions>({
  meta: {
    name: '@nuxtjs/i18n',
    configKey: 'i18n',
    compatibility: {
      nuxt: '>=3.0.0-rc.11',
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore property removed in Nuxt 4
      bridge: false,
    },
  },
  defaults: DEFAULT_OPTIONS,
  async setup(i18nOptions, nuxt) {
    const ctx = createContext(i18nOptions, nuxt)

    /**
     * prepare options
     */
    prepareOptions(ctx, nuxt)

    /**
     * auto imports
     */
    addComponent({
      name: 'NuxtLinkLocale',
      filePath: ctx.resolver.resolve(ctx.runtimeDir, 'components/NuxtLinkLocale'),
    })

    addComponent({
      name: 'SwitchLocalePathLink',
      filePath: ctx.resolver.resolve(ctx.runtimeDir, 'components/SwitchLocalePathLink'),
    })

    const vueI18nModulePath = resolveModule(`vue-i18n/dist/vue-i18n${ctx.vueI18nRuntimeOnly ? '.runtime' : ''}`)
    addImports({
      name: 'useI18n',
      from: vueI18nModulePath,
    })

    const composablesIndex = ctx.resolver.resolve(ctx.runtimeDir, 'composables/index')
    addImportsSources({
      from: composablesIndex,
      imports: [
        'useRouteBaseName',
        'useLocalePath',
        'useLocaleRoute',
        'useSwitchLocalePath',
        'useLocaleHead',
        'useBrowserLocale',
        'useCookieLocale',
        'useSetI18nParams',
        'useI18nPreloadKeys',
        DEFINE_I18N_ROUTE_FN,
        DEFINE_I18N_LOCALE_FN,
        DEFINE_I18N_CONFIG_FN,
      ],
    })

    /**
     * transpile and alias dependencies
     */
    const deps = [
      'vue-i18n',
      '@intlify/shared',
      '@intlify/core',
      '@intlify/core-base',
      '@intlify/utils',
      '@intlify/utils/h3',
      '@intlify/message-compiler',
    ]
    nuxt.options.build.transpile.push('@nuxtjs/i18n', ...deps)

    for (const dep of deps) {
      if (dep === 'vue-i18n' || dep === '@intlify/core') { continue }
      nuxt.options.alias[dep] = resolveModule(dep)
    }
    nuxt.options.alias['vue-i18n'] = vueI18nModulePath
    nuxt.options.alias['@intlify/core'] = resolveModule(`@intlify/core/dist/core.node`)

    /**
     * exclude ESM dependencies from optimization
     * @see https://github.com/nuxt/nuxt/blob/8db24c6a7fbcff7ab74b3ce1a196daece2f8c701/packages/vite/src/shared/client.ts#L9-L20
     */
    nuxt.options.vite.optimizeDeps ||= {}
    nuxt.options.vite.optimizeDeps.exclude ||= []
    nuxt.options.vite.optimizeDeps.exclude.push(...deps)

    /**
     * typescript hoist dependencies and include i18n directories
     */
    nuxt.options.typescript.hoist ||= []
    nuxt.options.typescript.hoist.push(...deps)

    nuxt.options.typescript.tsConfig.include ||= []
    nuxt.options.typescript.tsConfig.include.push(
      ...ctx.i18nLayers.map(l => relative(nuxt.options.buildDir, l.i18nDir + '/**/*')),
    )

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
  },
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
    registerModule: (config: Pick<NuxtI18nOptions<unknown>, 'langDir' | 'locales'>) => void,
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

  'i18n:localeSwitched': (params: { oldLocale: Locale, newLocale: Locale }) => HookResult
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
