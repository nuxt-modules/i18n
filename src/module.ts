import createDebug from 'debug'
import { isBoolean, isObject, isString } from '@intlify/shared'
import { defineNuxtModule, isNuxt2, isNuxt3, getNuxtVersion, addPlugin, addTemplate, addImports } from '@nuxt/kit'
import { resolve } from 'pathe'
import { setupAlias } from './alias'
import { setupPages } from './pages'
import { extendMessages } from './messages'
import { extendBundler } from './bundler'
import { generateLoaderOptions } from './gen'
import { NUXT_I18N_MODULE_ID, DEFAULT_OPTIONS } from './constants'
import { formatMessage, getNormalizedLocales, resolveLocales } from './utils'
import { distDir, runtimeDir, resolveVueI18nPkgPath, resolveVueI18nRoutingPkgPath } from './dirs'

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
    const options = i18nOptions as Required<NuxtI18nOptions>
    debug('options', options)

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

    if (options.strategy === 'no_prefix' && options.differentDomains) {
      console.warn(
        formatMessage(
          'The `differentDomains` option and `no_prefix` strategy are not compatible. Change strategy or disable `differentDomains` option.'
        )
      )
    }

    /**
     * resolve lang directory
     */

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
        : {}

    /**
     * extend messages via 3rd party nuxt modules
     */

    const additionalMessages = await extendMessages(nuxt, localeCodes)

    /**
     * setup nuxt/pages
     */

    if (options.strategy !== 'no_prefix' && localeCodes.length) {
      await setupPages(options, nuxt, { isBridge: isNuxt2(nuxt), localeCodes })
    }

    /**
     * setup module alias
     */

    await setupAlias(nuxt)

    /**
     * add plugin and templates
     */

    // plugin
    addPlugin(resolve(runtimeDir, 'plugin'))

    // for compoables
    const i18nPath = addTemplate({
      filename: 'i18n.mjs',
      src: resolve(distDir, 'runtime/composables.mjs')
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    nuxt.options.alias['#i18n'] = i18nPath.dst!
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
    addTemplate({
      filename: 'i18n.options.mjs',
      write: true,
      getContents: () => {
        return generateLoaderOptions(
          options.lazy,
          langPath,
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
          nuxt.options.dev
        )
      }
    })

    /**
     * generate type definition for page meta
     */

    if (!!options.dynamicRouteParams) {
      const metaKey = isBoolean(options.dynamicRouteParams) ? 'nuxtI18n' : options.dynamicRouteParams
      const typeMetaFilename = 'types/i18n-page-meta.d.ts'
      addTemplate({
        filename: typeMetaFilename,
        getContents: () => {
          return [
            `declare module '#app' {`,
            '  interface PageMeta {',
            `    ${metaKey}?: Record<string, any>`,
            '  }',
            '}'
          ].join('\n')
        }
      })
      // add declarations for page meta
      nuxt.hook('prepare:types', ({ references }) => {
        references.push({ path: resolve(nuxt.options.buildDir, typeMetaFilename) })
      })
    }

    /**
     * add extend type definition
     */

    // prettier-ignore
    const isLegacyMode = () => {
      return isString(options.types)
        ? options.types === 'legacy'
        : isObject(options.vueI18n)
          ? options.vueI18n.legacy
          : false
    }
    const nuxtAppExtendFilename = 'types/i18n-nuxt-app.d.ts'
    const vueI18nDir = await resolveVueI18nPkgPath()
    const vueI18nRoutingDir = await resolveVueI18nRoutingPkgPath()
    addTemplate({
      filename: nuxtAppExtendFilename,
      getContents: () => {
        return [
          `import type { ${isLegacyMode() ? 'VueI18n' : 'ExportedGlobalComposer'} } from 'vue-i18n'`,
          // prettier-ignore
          `import type { NuxtI18nRoutingCustomProperties } from '${resolve(runtimeDir, 'types')}'`,
          `import type { I18nRoutingCustomProperties } from 'vue-i18n-routing/dist/vue-i18n'`,
          isLegacyMode() ? `import '${resolve(vueI18nRoutingDir, 'dist/vue')}'` : '',
          `declare module '#app' {`,
          '  interface NuxtApp {',
          // prettier-ignore
          `    $i18n: ${isLegacyMode() ? 'VueI18n' : 'ExportedGlobalComposer'} & NuxtI18nRoutingCustomProperties & I18nRoutingCustomProperties`,
          '  }',
          '}'
        ].join('\n')
      }
    })
    nuxt.hook('prepare:types', ({ references }) => {
      references.push({ path: resolve(nuxt.options.buildDir, nuxtAppExtendFilename) })
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
     * auto imports
     */

    await addImports([
      { name: 'useI18n', from: resolve(vueI18nDir, 'dist/vue-i18n') },
      ...[
        'useRouteBaseName',
        'useLocalePath',
        'useLocaleRoute',
        'useSwitchLocalePath',
        'useLocaleHead',
        'useBrowserLocale',
        'useCookieLocale',
        'defineI18nRoute'
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
      if (isString(locale) || !locale.file) {
        throw new Error(
          formatMessage(
            `All locales must be objects and have the "file" property set when using "langDir".\nFound none in:\n${JSON.stringify(
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

declare module '@nuxt/schema' {
  interface NuxtConfig {
    i18n?: NuxtI18nOptions
  }

  interface NuxtHooks {
    'i18n:extend-messages': (messages: LocaleMessages<DefineLocaleMessage>[], localeCodes: string[]) => Promise<void>
  }
}
