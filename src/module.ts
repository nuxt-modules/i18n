import { addTemplate, defineNuxtModule } from '@nuxt/kit'
import { setupAlias } from './alias'
import { setupPages } from './pages'
import { setupNitro } from './nitro'
import { extendBundler } from './bundler'
import { NUXT_I18N_MODULE_ID, DEFAULT_OPTIONS } from './constants'
import type { HookResult } from '@nuxt/schema'
import type { I18nPublicRuntimeConfig, LocaleInfo, LocaleObject, LocaleType, NuxtI18nOptions } from './types'
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
import { deepCopy } from '@intlify/shared'
import { parseJSON, parseJSON5, parseYAML } from 'confbox'
import { convertToImportId, getHash, readFile } from './utils'
import { relative, resolve, parse as parsePath } from 'pathe'
import { genSafeVariableName } from 'knitwork'

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

    const processed: Record<string, { type: LocaleType; files: NonNullable<LocaleInfo['meta']> }[]> = {}

    // Create an array of file arrays grouped by their LocaleType
    for (const l of ctx.localeInfo) {
      processed[l.code] ??= []
      for (const f of l?.meta ?? []) {
        if (processed[l.code].length === 0 || processed[l.code].at(-1)!.type !== f.type) {
          processed[l.code].push({ type: f.type, files: [] })
        }

        processed[l.code].at(-1)!.files.push(f)
      }
    }

    // Read and merge grouped static files and write to merged file
    for (const code in processed) {
      const localeChains = processed[code]

      for (let entryIndex = 0; entryIndex < localeChains.length; entryIndex++) {
        const entry = localeChains[entryIndex]
        if (entry.type !== 'static') continue
        const msg = {}

        for (let i = 0; i < entry.files.length; i++) {
          const f = entry.files[i]

          const fileCode = await readFile(f.path)
          let contents: unknown

          if (/ya?ml/.test(f.parsed.ext)) {
            contents = await parseYAML(fileCode)
          }

          if (/json5/.test(f.parsed.ext)) {
            contents = await parseJSON5(fileCode)
          }

          if (/json$/.test(f.parsed.ext)) {
            contents = await parseJSON(fileCode)
          }

          if (contents != null) {
            deepCopy(contents, msg)
          }
        }

        if (entry.type === 'static') {
          const staticFile = resolve(nuxt.options.buildDir, `i18n/${code}-static-${entryIndex}.json`)

          addTemplate({
            filename: `i18n/${code}-static-${entryIndex}.json`,
            write: true,
            getContents() {
              return JSON.stringify(msg, null, 2)
            }
          })

          const currentLocaleInfo = ctx.localeInfo.find(localInfoEntry => localInfoEntry.code === code)!

          // Find and replace source static files with generated merged file
          let start = 0
          let end = 0
          for (let lFileIndex = 0; lFileIndex < currentLocaleInfo.files.length; lFileIndex++) {
            if (entry.files.at(0)!.path === currentLocaleInfo.files[lFileIndex].path) {
              start = lFileIndex
            }

            if (entry.files.at(-1)!.path === currentLocaleInfo.files[lFileIndex].path) {
              end = lFileIndex
            }
          }

          const staticFilePath = resolve(nuxt.options.buildDir, staticFile)
          const processedStaticFile = { path: staticFilePath, cache: true }

          currentLocaleInfo.files.splice(start, end + 1, processedStaticFile)
          currentLocaleInfo.meta!.splice(start, end + 1, {
            path: staticFilePath,
            loadPath: relative(nuxt.options.buildDir, staticFilePath),
            file: processedStaticFile,
            hash: getHash(staticFilePath),
            key: genSafeVariableName(`locale_${convertToImportId(relative(nuxt.options.buildDir, staticFilePath))}`),
            parsed: parsePath(staticFilePath),
            type: 'static'
          })
        }
      }
    }

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
