import { addBuildPlugin, useNuxt } from '@nuxt/kit'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n'
import { toArray } from './utils'
import { TransformMacroPlugin } from './transform/macros'
import { ResourcePlugin } from './transform/resource'
import { TransformI18nFunctionPlugin } from './transform/i18n-function-injection'
import { HeistPlugin } from './transform/heist'
import { addDefinePlugin } from 'nuxt-define'

import type { Nuxt } from '@nuxt/schema'
import type { PluginOptions } from '@intlify/unplugin-vue-i18n'
import type { BundlerPluginOptions } from './transform/utils'
import type { I18nNuxtContext } from './context'
import { DEFAULT_COOKIE_KEY, DYNAMIC_PARAMS_KEY, FULL_STATIC_LIFETIME, SWITCH_LOCALE_PATH_LINK_IDENTIFIER } from './constants'
import { version } from '../package.json'

export async function extendBundler(ctx: I18nNuxtContext, nuxt: Nuxt) {
  /**
   * shared plugins (nuxt/nitro)
   */
  const pluginOptions: BundlerPluginOptions = {
    sourcemap: !!nuxt.options.sourcemap.server || !!nuxt.options.sourcemap.client,
  }
  const resourcePlugin = ResourcePlugin(pluginOptions, ctx)

  addBuildPlugin(resourcePlugin)
  nuxt.hook('nitro:config', async (cfg) => {
    cfg.rollupConfig!.plugins = (await cfg.rollupConfig!.plugins) || []
    cfg.rollupConfig!.plugins = toArray(cfg.rollupConfig!.plugins)
    cfg.rollupConfig!.plugins.push(HeistPlugin(pluginOptions, ctx).rollup())
    cfg.rollupConfig!.plugins.push(resourcePlugin.rollup())
  })

  /**
   * shared plugins (vite/webpack/rspack)
   */
  const localePaths = [...new Set(ctx.localeInfo.flatMap(x => x.meta.map(m => m.path)))]
  ctx.fullStatic = ctx.localeInfo.flatMap(x => x.meta).every(x => x.type === 'static' || x.cache !== false)

  const vueI18nPluginOptions: PluginOptions = {
    ...ctx.options.bundle,
    ...ctx.options.compilation,
    ...ctx.options.customBlocks,
    allowDynamic: true,
    optimizeTranslationDirective: false,
    include: localePaths.length ? localePaths : [],
  }
  addBuildPlugin({
    vite: () => VueI18nPlugin.vite(vueI18nPluginOptions),

    webpack: () => VueI18nPlugin.webpack(vueI18nPluginOptions),
  })
  addBuildPlugin(TransformMacroPlugin(pluginOptions))
  if (ctx.options.autoDeclare && nuxt.options.imports.autoImport !== false) {
    addBuildPlugin(TransformI18nFunctionPlugin(pluginOptions))
  }

  const defineConfig = getDefineConfig(ctx)
  await addDefinePlugin(defineConfig)
}

export function getDefineConfig(
  { options, fullStatic, deploymentHash }: I18nNuxtContext,
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
    __DIFFERENT_DOMAINS__: String(options.differentDomains),
    __MULTI_DOMAIN_LOCALES__: String(options.multiDomainLocales),
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
    __I18N_STRICT_SEO__: JSON.stringify(!!options.experimental.strictSeo),
    __I18N_SERVER_ROUTE__: JSON.stringify([options.serverRoutePrefix, deploymentHash].join('/')),
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
