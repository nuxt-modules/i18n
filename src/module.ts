import { addComponent, addImports, addImportsSources, addPlugin, addTemplate, addTypeTemplate, defineNuxtModule, resolveModule } from '@nuxt/kit'
import { setupPages } from './pages'
import { setupNitro } from './nitro'
import { extendBundler } from './bundler'
import { DEFAULT_OPTIONS } from './constants'
import type { HookResult } from '@nuxt/schema'
import type { I18nPublicRuntimeConfig, LocaleObject, NuxtI18nOptions } from './types'
import type { Locale } from 'vue-i18n'
import { createContext } from './context'
import { prepareOptions } from './prepare/options'
import { resolveLocaleInfo } from './prepare/locale-info'
import { prepareHMR } from './prepare/runtime'
import { prepareRuntimeConfig } from './prepare/runtime-config'
import { prepareBuildManifest } from './prepare/build-manifest'
import { prepareStrategy } from './prepare/strategy'
import { prepareTypeGeneration } from './prepare/type-generation'
import { relative } from 'pathe'
import { generateTemplateNuxtI18nOptions } from './template'
import { generateI18nTypes, generateLoaderOptions } from './gen'

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

    addImports({
      name: 'useI18n',
      from: 'vue-i18n',
    })

    addImportsSources({
      from: ctx.resolver.resolve(ctx.runtimeDir, 'composables/index'),
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
        'defineI18nRoute',
        'defineI18nLocale',
        'defineI18nConfig',
      ],
    })

    const deps = [
      'vue-i18n',
      '@intlify/shared',
      '@intlify/core',
      '@intlify/core-base',
      '@intlify/utils',
      '@intlify/utils/h3',
      '@intlify/message-compiler',
    ]

    /**
     * alias and transpile dependencies
     */
    for (const dep of deps) {
      if (dep === 'vue-i18n' || dep === '@intlify/core') { continue }
      nuxt.options.alias[dep] = resolveModule(dep)
    }
    const vueI18nRuntimeOnly = !nuxt.options.dev && !nuxt.options._prepare && ctx.options.bundle?.runtimeOnly
    nuxt.options.alias['vue-i18n'] = resolveModule(`vue-i18n/dist/vue-i18n${vueI18nRuntimeOnly ? '.runtime' : ''}`)
    nuxt.options.alias['@intlify/core'] = resolveModule(`@intlify/core/dist/core.node`)
    nuxt.options.build.transpile.push('@nuxtjs/i18n', ...deps)

    /**
     * alias and transpile runtime and internals
     */
    nuxt.options.alias['#i18n'] = ctx.resolver.resolve('./runtime/composables/index')
    nuxt.options.alias['#i18n-kit'] = ctx.resolver.resolve('./runtime/kit')
    nuxt.options.alias['#internal-i18n-types'] = ctx.resolver.resolve('./types')
    nuxt.options.build.transpile.push('#i18n', '#i18n-kit', '#internal-i18n-types')

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
    addPlugin(ctx.resolver.resolve('./runtime/plugins/i18n'))
    if (nuxt.options.dev || nuxt.options._prepare) {
      addPlugin(ctx.resolver.resolve('./runtime/plugins/dev'))
    }
    addPlugin(ctx.resolver.resolve('./runtime/plugins/preload'))
    addPlugin(ctx.resolver.resolve('./runtime/plugins/route-locale-detect'))
    addPlugin(ctx.resolver.resolve('./runtime/plugins/ssg-detect'))
    addPlugin(ctx.resolver.resolve('./runtime/plugins/switch-locale-path-ssr'))

    addTemplate({
      filename: 'i18n-options.mjs',
      getContents: () => generateTemplateNuxtI18nOptions(ctx, generateLoaderOptions(ctx, nuxt)),
    })

    /**
     * `$i18n` type narrowing based on 'legacy' or 'composition'
     * `locales` type narrowing based on generated configuration
     */
    addTypeTemplate({
      filename: 'types/i18n-plugin.d.ts',
      getContents: () => generateI18nTypes(nuxt, ctx),
    })

    prepareHMR(ctx, nuxt)

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
