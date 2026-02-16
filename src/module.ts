import { addComponent, addImports, addImportsSources, addPlugin, addTemplate, addTypeTemplate, addVitePlugin, defineNuxtModule, resolveModule, useNitro } from '@nuxt/kit'
import { defu } from 'defu'
import { setupPages } from './pages'
import { setupNitro } from './nitro'
import { extendBundler } from './bundler'
import { DEFAULT_OPTIONS } from './constants'
import type { HookResult } from '@nuxt/schema'
import type { I18nPublicRuntimeConfig, LocaleObject, NuxtI18nOptions } from './types'
import type { Locale } from 'vue-i18n'
import { createContext } from './context'
import { prepareOptions } from './prepare/options'
import { prepareTypeGeneration } from './prepare/type-generation'
import { relative } from 'pathe'
import { generateTemplateNuxtI18nOptions } from './template'
import { generateI18nTypes, generateLoaderOptions, simplifyLocaleOptions } from './gen'
import { applyLayerOptions, resolveLayerVueI18nConfigInfo } from './layers'
import { filterLocales, resolveLocales } from './utils'
import { isString } from '@intlify/shared'

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

    prepareOptions(ctx, nuxt)

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

    for (const dep of deps) {
      if (dep === 'vue-i18n' || dep === '@intlify/core') { continue }
      nuxt.options.alias[dep] = resolveModule(dep)
    }
    const vueI18nRuntimeOnly = !nuxt.options.dev && !nuxt.options._prepare && ctx.options.bundle?.runtimeOnly
    nuxt.options.alias['vue-i18n'] = resolveModule(`vue-i18n/dist/vue-i18n${vueI18nRuntimeOnly ? '.runtime' : ''}`)
    nuxt.options.alias['@intlify/core'] = resolveModule(`@intlify/core/dist/core.node`)
    nuxt.options.build.transpile.push('@nuxtjs/i18n', ...deps)

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
     * hoist deps and include i18n directories
     */
    nuxt.options.typescript.hoist ||= []
    nuxt.options.typescript.hoist.push(...deps)

    nuxt.options.typescript.tsConfig.include ||= []
    nuxt.options.typescript.tsConfig.include.push(
      ...ctx.i18nLayers.map(l => relative(nuxt.options.buildDir, l.i18nDir + '/**/*')),
    )

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

    /**
     * HMR plugin
     */
    if (nuxt.options.dev && ctx.options.hmr) {
      addVitePlugin({
        name: 'i18n:options-hmr',
        configureServer(server) {
          const reloadClient = () => server.ws.send({ type: 'full-reload' })

          server.ws.on('i18n:options-complex-invalidation', () => {
            // await dev reload if type generation is enabled
            if (ctx.options.experimental.typedOptionsAndMessages) {
              useNitro().hooks.hookOnce('dev:reload', reloadClient)
              return
            }

            reloadClient()
          })
        },
      })
    }

    /**
     * generate vue-i18n and messages types using runtime server endpoint
     */
    await prepareTypeGeneration(ctx, nuxt)

    /**
     * allow other modules to register i18n hooks - locales and options will be resolved in this hook
     */
    nuxt.hook('modules:done', async () => {
      ctx.options.locales = await applyLayerOptions(ctx, nuxt)
      ctx.options.locales = filterLocales(ctx, nuxt)

      ctx.normalizedLocales = ctx.options.locales.map(x => (isString(x) ? { code: x, language: x } : x))
      ctx.localeCodes = ctx.normalizedLocales.map(locale => locale.code)
      ctx.localeInfo = resolveLocales(nuxt.options.srcDir, ctx.normalizedLocales, nuxt.vfs)

      ctx.vueI18nConfigPaths = await resolveLayerVueI18nConfigInfo(ctx)

      /**
       * expose i18n options via runtime config for use in app/server contexts
       */
      // @ts-expect-error generated type
      nuxt.options.runtimeConfig.public.i18n = defu(nuxt.options.runtimeConfig.public.i18n, {
        baseUrl: ctx.options.baseUrl,
        defaultLocale: ctx.options.defaultLocale,
        rootRedirect: ctx.options.rootRedirect,
        redirectStatusCode: ctx.options.redirectStatusCode,
        skipSettingLocaleOnNavigate: ctx.options.skipSettingLocaleOnNavigate,
        locales: ctx.options.locales,
        detectBrowserLanguage: ctx.options.detectBrowserLanguage ?? DEFAULT_OPTIONS.detectBrowserLanguage,
        experimental: ctx.options.experimental,
        domainLocales: Object.fromEntries(
          ctx.options.locales.map((l) => {
            if (typeof l === 'string') {
              return [l, { domain: '' }]
            }
            return [l.code, { domain: l.domain ?? '' }]
          }),
        ) as I18nPublicRuntimeConfig['domainLocales'],
      })

      nuxt.options.runtimeConfig.public.i18n.locales = simplifyLocaleOptions(ctx, nuxt)

      /**
       * ignore `/` during prerender when using prefixed routing
       */
      if (ctx.options.strategy === 'prefix' && nuxt.options.nitro.static) {
        const localizedEntryPages = ctx.localeCodes.map(x => '/' + x)
        nuxt.hook('nitro:config', (config) => {
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
       * disable preloading/prefetching of locale files
       */
      nuxt.hook('build:manifest', (manifest) => {
        const langFiles = ctx.localeInfo
          .flatMap(locale => locale.meta.map(m => m.path))
          .map(x => relative(nuxt.options.srcDir, x))
        const langPaths = [...new Set(langFiles)]

        for (const key in manifest) {
          if (langPaths.some(x => key.startsWith(x))) {
            manifest[key]!.prefetch = false
            manifest[key]!.preload = false
          }
        }
      })

      await setupPages(ctx, nuxt)

      await extendBundler(ctx, nuxt)

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
