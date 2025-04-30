/* eslint-disable @typescript-eslint/no-floating-promises */
import createDebug from 'debug'
import { extendViteConfig, addWebpackPlugin, addBuildPlugin, addTemplate, addRspackPlugin } from '@nuxt/kit'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n'
import { toArray } from './utils'
import { TransformMacroPlugin } from './transform/macros'
import { ResourcePlugin } from './transform/resource'
import { TransformI18nFunctionPlugin } from './transform/i18n-function-injection'
import { asI18nVirtual } from './transform/utils'
import { version } from '../package.json'

import type { Nuxt } from '@nuxt/schema'
import type { PluginOptions } from '@intlify/unplugin-vue-i18n'
import type { BundlerPluginOptions } from './transform/utils'
import type { I18nNuxtContext } from './context'

const debug = createDebug('@nuxtjs/i18n:bundler')

export async function extendBundler(ctx: I18nNuxtContext, nuxt: Nuxt) {
  addTemplate({
    write: true,
    filename: 'nuxt-i18n-logger.mjs',
    getContents() {
      if (!ctx.options.debug && !nuxt.options._i18nTest) {
        return `export function createLogger() {}`
      }

      return `
import { createConsola } from 'consola'
const debugLogger = createConsola({ level: ${ctx.options.debug === 'verbose' ? 999 : 4} }).withTag('i18n')
export function createLogger(label) {
  return debugLogger.withTag(label)
}`
    }
  })

  nuxt.options.alias[asI18nVirtual('logger')] = ctx.resolver.resolve(nuxt.options.buildDir, './nuxt-i18n-logger.mjs')

  /**
   * shared plugins (nuxt/nitro)
   */
  const pluginOptions: BundlerPluginOptions = {
    sourcemap: !!nuxt.options.sourcemap.server || !!nuxt.options.sourcemap.client
  }
  const resourcePlugin = ResourcePlugin(pluginOptions, ctx)

  addBuildPlugin(resourcePlugin)
  nuxt.hook('nitro:config', async cfg => {
    cfg.rollupConfig!.plugins = (await cfg.rollupConfig!.plugins) || []
    cfg.rollupConfig!.plugins = toArray(cfg.rollupConfig!.plugins)
    cfg.rollupConfig!.plugins.push(resourcePlugin.rollup())
  })

  /**
   * shared plugins (vite/webpack/rspack)
   */
  const { options } = ctx
  const localePaths = [...new Set([...ctx.localeInfo.flatMap(x => x.meta.map(m => m.path))])]
  const vueI18nPluginOptions: PluginOptions = {
    allowDynamic: true,
    include: localePaths.length ? localePaths : undefined,
    runtimeOnly: options.bundle.runtimeOnly,
    fullInstall: options.bundle.fullInstall,
    onlyLocales: options.bundle.onlyLocales,
    escapeHtml: options.compilation.escapeHtml,
    compositionOnly: options.bundle.compositionOnly,
    strictMessage: options.compilation.strictMessage,
    defaultSFCLang: options.customBlocks.defaultSFCLang,
    globalSFCScope: options.customBlocks.globalSFCScope,
    dropMessageCompiler: options.bundle.dropMessageCompiler,
    optimizeTranslationDirective: options.bundle.optimizeTranslationDirective
  }
  addBuildPlugin({
    vite: () => VueI18nPlugin.vite(vueI18nPluginOptions),
    webpack: () => VueI18nPlugin.webpack(vueI18nPluginOptions)
  })
  addBuildPlugin(TransformMacroPlugin(pluginOptions))
  if (options.experimental.autoImportTranslationFunctions) {
    addBuildPlugin(TransformI18nFunctionPlugin(pluginOptions))
  }

  const defineConfig = {
    ...getFeatureFlags(options.bundle),
    __DEBUG__: String(!!options.debug),
    __TEST__: String(!!options.debug || nuxt.options._i18nTest),
    __NUXT_I18N_VERSION__: JSON.stringify(version)
  }
  /**
   * webpack plugin
   */
  if (nuxt.options.builder === '@nuxt/webpack-builder') {
    try {
      const webpack = await import('webpack').then(m => m.default || m)
      addWebpackPlugin(new webpack.DefinePlugin(defineConfig))
    } catch (e: unknown) {
      debug((e as Error).message)
    }
  }

  /**
   * rspack plugin
   */
  if (nuxt.options.builder === '@nuxt/rspack-builder') {
    try {
      const { rspack } = await import('@rspack/core')
      addRspackPlugin(new rspack.DefinePlugin(defineConfig))
    } catch (e: unknown) {
      debug((e as Error).message)
    }
  }

  /**
   * vite plugin
   */
  extendViteConfig(config => {
    config.define ??= {}
    config.define['__DEBUG__'] = defineConfig['__DEBUG__']
    config.define['__TEST__'] = defineConfig['__TEST__']
    config.define['__NUXT_I18N_VERSION__'] = JSON.stringify(version)

    debug('vite.config.define', config.define)
  })
}

export function getFeatureFlags({ compositionOnly = true, fullInstall = true, dropMessageCompiler = false }) {
  return {
    __VUE_I18N_FULL_INSTALL__: String(fullInstall),
    __VUE_I18N_LEGACY_API__: String(!compositionOnly),
    __INTLIFY_PROD_DEVTOOLS__: 'false',
    __INTLIFY_DROP_MESSAGE_COMPILER__: String(dropMessageCompiler)
  }
}
