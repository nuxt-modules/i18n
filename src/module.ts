import createJiti from 'jiti'
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
import { relative, resolve, parse as parsePath, extname } from 'pathe'
import { genSafeVariableName } from 'knitwork'

export * from './types'

// https://github.com/unjs/c12/blob/main/src/loader.ts#L26
const PARSERS = {
  '.yaml': () => import('confbox/yaml').then(r => r.parseYAML),
  '.yml': () => import('confbox/yaml').then(r => r.parseYAML),
  '.jsonc': () => import('confbox/jsonc').then(r => r.parseJSONC),
  '.json5': () => import('confbox/json5').then(r => r.parseJSON5),
  '.toml': () => import('confbox/toml').then(r => r.parseTOML),
  '.json': () => JSON.parse
} as const

const SUPPORTED_EXTENSIONS = [
  // with jiti
  '.js',
  '.ts',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
  '.json',
  // with confbox
  '.jsonc',
  '.json5',
  '.yaml',
  '.yml',
  '.toml'
] as const

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

    const processed: Record<string, { type: LocaleType; cache?: boolean; files: NonNullable<LocaleInfo['meta']> }[]> =
      {}

    // Create an array of file arrays grouped by their LocaleType
    for (const l of ctx.localeInfo) {
      processed[l.code] ??= []
      if (l.meta == null) continue

      for (let fileIndex = 0; fileIndex < l.meta.length; fileIndex++) {
        const f = l.meta[fileIndex]

        if (processed[l.code].length === 0 || processed[l.code].at(-1)!.type !== f.type || f.file.cache === false) {
          processed[l.code].push({ type: f.type, cache: f.file.cache, files: [] })
        }

        processed[l.code].at(-1)!.files.push(f)
      }
    }

    const jiti = createJiti(nuxt.options.rootDir, {
      interopDefault: true,
      extensions: [...SUPPORTED_EXTENSIONS]
    })

    async function loadTarget(absPath: string, args: unknown[] = []) {
      try {
        const configFileExt = extname(absPath) || ''
        let result
        const contents = await readFile(absPath)
        if (configFileExt in PARSERS) {
          const asyncLoader = await PARSERS[configFileExt as keyof typeof PARSERS]()
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          result = asyncLoader(contents)
        } else {
          result = await jiti.import(absPath, {})
        }

        if (result instanceof Function) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          return (await result.call(undefined, ...args)) as unknown
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return result
      } catch (err) {
        console.log(err)
        return undefined
      }
    }

    // Read and merge grouped static files and write to merged file
    for (const code in processed) {
      const localeChains = processed[code]

      for (let entryIndex = 0; entryIndex < localeChains.length; entryIndex++) {
        const entry = localeChains[entryIndex]
        if (entry.type !== 'static' || entry.cache === false) continue
        const merged = {}

        const messages = await Promise.all(
          entry.files.map(async f => {
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

            if (/[cm]?[jt]s$/.test(f.parsed.ext)) {
              contents = await loadTarget(f.path)
            }

            return contents
          })
        )

        for (const message of messages) {
          if (message != null) {
            deepCopy(message, merged)
          }
        }

        const staticFile = resolve(nuxt.options.buildDir, `i18n/${code}-static-${entryIndex}.json`)

        addTemplate({
          filename: `i18n/${code}-static-${entryIndex}.json`,
          write: true,
          getContents() {
            return JSON.stringify(merged, null, 2)
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
