import { addBuildPlugin, addVitePlugin, addWebpackPlugin, useNuxt } from '@nuxt/kit'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n'
import { toArray } from './utils'
import { TransformMacroPlugin } from './transform/macros'
import { ResourcePlugin } from './transform/resource'
import { JsonParseMessagesPlugin, STATIC_RESOURCE_RE } from './transform/json-parse'
import { TransformI18nFunctionPlugin } from './transform/i18n-function-injection'
import { HeistPlugin } from './transform/heist'
import { addDefinePlugin } from 'nuxt-define'

import type { Nuxt } from '@nuxt/schema'
import type { PluginOptions } from '@intlify/unplugin-vue-i18n'
import type { BundlerPluginOptions } from './transform/utils'
import type { ResolvedI18nContext } from './context'
import { DEFAULT_COOKIE_KEY, DYNAMIC_PARAMS_KEY, FULL_STATIC_LIFETIME, SWITCH_LOCALE_PATH_LINK_IDENTIFIER } from './constants'
import { version } from '../package.json'

export async function extendBundler(ctx: ResolvedI18nContext, nuxt: Nuxt) {
  /**
   * shared plugins (nuxt/nitro)
   */
  const pluginOptions: BundlerPluginOptions = {
    sourcemap: !!nuxt.options.sourcemap.server || !!nuxt.options.sourcemap.client,
  }
  const resourcePlugin = ResourcePlugin(pluginOptions, ctx)
  const jsonParsePlugin = ctx.options.experimental.optimizeMessageBundling ? JsonParseMessagesPlugin(ctx) : undefined

  addBuildPlugin(resourcePlugin)
  nuxt.hook('nitro:config', async (cfg) => {
    cfg.rollupConfig!.plugins = (await cfg.rollupConfig!.plugins) || []
    cfg.rollupConfig!.plugins = toArray(cfg.rollupConfig!.plugins)
    if (jsonParsePlugin) {
      cfg.rollupConfig!.plugins.push(jsonParsePlugin.rollup())
    }
    cfg.rollupConfig!.plugins.push(HeistPlugin(pluginOptions, ctx).rollup())
    cfg.rollupConfig!.plugins.push(resourcePlugin.rollup())
  })

  /**
   * shared plugins (vite/webpack/rspack)
   */
  // exclude dynamic locale files - optimization is a no-op for these, and since vite 8 matching them
  // makes unplugin-vue-i18n load them raw during dev SSR, skipping the `defineI18nLocale` transform (#4049)
  const localePaths = [...new Set(ctx.localeFileMetas.filter(m => m.type !== 'dynamic').map(m => m.path))]

  const vueI18nPluginOptions: PluginOptions = {
    ...ctx.options.bundle,
    ...ctx.options.compilation,
    ...ctx.options.customBlocks,
    allowDynamic: true,
    optimizeTranslationDirective: false,
    include: localePaths.length ? localePaths : [],
  }
  if (ctx.options.experimental.optimizeMessageBundling) {
    // precompiling only pays off client-side - the server graphs serve static resources raw
    // (JsonParseMessagesPlugin) and need the runtime compiler regardless of the client bundle settings
    const serverPluginOptions: PluginOptions = {
      ...vueI18nPluginOptions,
      dropMessageCompiler: false,
      runtimeOnly: false,
      include: localePaths.filter(x => !STATIC_RESOURCE_RE.test(x)),
    }
    // `prepend` - without it kit appends after ResourcePlugin, which then claims the virtual ids
    addVitePlugin(() => jsonParsePlugin!.vite(), { client: false, prepend: true })
    addVitePlugin(() => VueI18nPlugin.vite(vueI18nPluginOptions), { server: false })
    addVitePlugin(() => VueI18nPlugin.vite(serverPluginOptions), { client: false })
    addWebpackPlugin(() => VueI18nPlugin.webpack(vueI18nPluginOptions))
  } else {
    addBuildPlugin({
      vite: () => VueI18nPlugin.vite(vueI18nPluginOptions),
      webpack: () => VueI18nPlugin.webpack(vueI18nPluginOptions),
    })
  }
  addBuildPlugin(TransformMacroPlugin(pluginOptions))
  if (ctx.options.autoDeclare && nuxt.options.imports.autoImport !== false) {
    addBuildPlugin(TransformI18nFunctionPlugin(pluginOptions))
  }

  const defineConfig = getDefineConfig(ctx)
  await addDefinePlugin(defineConfig)
}

export function getDefineConfig(
  { options, fullStatic, localeHashes }: ResolvedI18nContext,
  server = false,
  nuxt = useNuxt(),
) {
  const cacheLifetime = options.experimental.cacheLifetime ?? (fullStatic ? FULL_STATIC_LIFETIME : -1)
  const isCacheEnabled = cacheLifetime >= 0 && (!nuxt.options.dev || !!options.experimental.devCache)

  // `stripMessagesPayload` is enabled by default when `experimental.preload` is set to true
  let stripMessagesPayload = !!options.experimental.preload
  if (nuxt.options.i18n && nuxt.options.i18n.experimental?.stripMessagesPayload != null) {
    stripMessagesPayload = nuxt.options.i18n.experimental.stripMessagesPayload
  }

  const common = {
    __IS_SSR__: String(nuxt.options.ssr),
    __IS_SSG__: String(!!nuxt.options.nitro.static),
    __PARALLEL_PLUGIN__: String(options.parallelPlugin),
    __DYNAMIC_PARAMS_KEY__: JSON.stringify(DYNAMIC_PARAMS_KEY),
    __DEFAULT_COOKIE_KEY__: JSON.stringify(DEFAULT_COOKIE_KEY),
    __NUXT_I18N_VERSION__: JSON.stringify(version),
    __SWITCH_LOCALE_PATH_LINK_IDENTIFIER__: JSON.stringify(SWITCH_LOCALE_PATH_LINK_IDENTIFIER),
    __I18N_STRATEGY__: JSON.stringify(options.strategy),
    // gate for domain-based locale resolution
    __I18N_DOMAINS__: String(options.differentDomains || options.multiDomainLocales),
    __ROUTE_NAME_SEPARATOR__: JSON.stringify(options.routesNameSeparator),
    __ROUTE_NAME_DEFAULT_SUFFIX__: JSON.stringify(options.defaultLocaleRouteNameSuffix),
    __TRAILING_SLASH__: String(options.trailingSlash),
    __DEFAULT_DIRECTION__: JSON.stringify(options.defaultDirection),
    __I18N_CACHE__: String(isCacheEnabled),
    __I18N_CACHE_LIFETIME__: JSON.stringify(cacheLifetime),
    __I18N_HTTP_CACHE_DURATION__: JSON.stringify(options.experimental.httpCacheDuration ?? 10),
    __I18N_FULL_STATIC__: String(fullStatic),
    __I18N_STRIP_UNUSED__: JSON.stringify(stripMessagesPayload),
    __I18N_PRELOAD__: JSON.stringify(!!options.experimental.preload),

    __I18N_ROUTING__: JSON.stringify(nuxt.options.pages.toString() && options.strategy !== 'no_prefix'),
    __I18N_COMPACT_ROUTES__: String(!!options.experimental?.compactRoutes),
    __I18N_STRICT_SEO__: JSON.stringify(!!options.experimental.strictSeo),
    __I18N_SERVER_ROUTE__: JSON.stringify(options.serverRoutePrefix),
    // SSG already prerenders the messages routes (runtime `prerenderRoutes`), so they exist at the
    // CDN origin there too — honor `app.cdnURL` for both that and the opt-in `prerenderMessages`.
    __I18N_CDN__: String(!!nuxt.options.app.cdnURL && (!!options.experimental.prerenderMessages || !!nuxt.options.nitro.static)),
    __I18N_LOCALE_HASHES__: JSON.stringify(localeHashes),
    __I18N_SERVER_REDIRECT__: JSON.stringify(!!options.experimental.nitroContextDetection),
  }

  if (nuxt.options.ssr || !server) {
    return {
      ...common,
      __VUE_I18N_LEGACY_API__: String(!(options.bundle?.compositionOnly ?? true)),
      __VUE_I18N_FULL_INSTALL__: String(options.bundle?.fullInstall ?? true),
      __INTLIFY_PROD_DEVTOOLS__: 'false',
      __INTLIFY_DROP_MESSAGE_COMPILER__: String(options.bundle?.dropMessageCompiler ?? false),
    }
  }

  return common
}
