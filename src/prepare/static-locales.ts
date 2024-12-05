import createJiti from 'jiti'
import { addTemplate } from '@nuxt/kit'
import { deepCopy } from '@intlify/shared'
import { convertToImportId, getHash, readFile } from '../utils'
import { relative, resolve, parse as parsePath, extname } from 'pathe'
import { genSafeVariableName } from 'knitwork'

import type { Nuxt } from '@nuxt/schema'
import type { I18nNuxtContext } from '../context'
import type { LocaleInfo, LocaleType } from '../types'

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

export async function prepareStaticLocales(ctx: I18nNuxtContext, nuxt: Nuxt) {
  const processed: Record<string, { type: LocaleType; cache?: boolean; files: NonNullable<LocaleInfo['meta']> }[]> = {}

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
          return (await loadTarget(f.path)) as unknown
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
}
