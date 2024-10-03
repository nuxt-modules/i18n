import type { Nuxt } from '@nuxt/schema'
import { createJiti } from 'jiti'
import { addTypeTemplate, updateTemplates } from '@nuxt/kit'
import { deepCopy } from '@intlify/shared'
import { readFile } from './utils'
import { extname, resolve } from 'pathe'

import type { I18nOptions } from 'vue-i18n'
import type { NumberFormatOptions } from '@intlify/core'
import type { I18nNuxtContext } from './context'

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

export function enableVueI18nTypeGeneration(
  { options: _options, localeInfo, vueI18nConfigPaths }: I18nNuxtContext,
  nuxt: Nuxt
) {
  const jiti = createJiti(nuxt.options.rootDir, {
    interopDefault: true,
    moduleCache: false,
    fsCache: false,
    requireCache: false,
    extensions: [...SUPPORTED_EXTENSIONS]
  })

  const keyTranslationMap = new Map<string, string>()

  function generateInterface(obj: Record<string, unknown>, indentLevel = 1) {
    const indent = '  '.repeat(indentLevel)
    let str = ''

    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue

      keyTranslationMap.set(key, String(obj[key]))

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        str += `${indent}${key}: {\n`
        str += generateInterface(obj[key] as Record<string, unknown>, indentLevel + 1)
        str += `${indent}};\n`
      } else {
        str += `${indent}/**\n`
        str += `${indent} * ${JSON.stringify(obj[key])}\n`
        str += `${indent} */\n`
        let propertyType = Array.isArray(obj[key]) ? 'unknown[]' : typeof obj[key]
        if (propertyType === 'function') {
          propertyType = '() => string'
        }
        str += `${indent}${key}: ${propertyType};\n`
      }
    }
    return str
  }

  nuxt.options._i18n = { locales: localeInfo }

  addTypeTemplate({
    filename: 'types/i18n-messages.d.ts',
    getContents: async ({ nuxt }) => {
      const messages = {}
      const dateFormats = {}
      const numberFormats = {}

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      globalThis.defineI18nLocale = val => val

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      globalThis.defineI18nConfig = val => val

      // @ts-ignore
      globalThis.useRuntimeConfig = () => nuxt.options.runtimeConfig

      const fetch = await import('ofetch').then(r => r.ofetch)
      globalThis.$fetch = fetch

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
            result = await jiti.import(absPath)
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

      for (const config of vueI18nConfigPaths) {
        const res = (await loadTarget(config.absolute)) as I18nOptions | undefined

        if (res == null) continue
        for (const v of Object.values(res.messages ?? [])) {
          deepCopy(v, messages)
        }

        for (const v of Object.values(res.numberFormats ?? [])) {
          deepCopy(v, numberFormats)
        }

        for (const v of Object.values(res.datetimeFormats ?? [])) {
          deepCopy(v, dateFormats)
        }
      }

      for (const l of nuxt.options._i18n?.locales ?? []) {
        for (const f of l.files) {
          const resolvedPath = resolve(nuxt.options.srcDir, f.path)
          // console.log(resolvedPath, f.path)
          // const contents = await readFile(resolvedPath)
          // console.log(resolvedPath, await loadTarget(resolvedPath, [l.code]))
          try {
            deepCopy((await loadTarget(resolvedPath, [l.code])) ?? {}, messages)
          } catch (err) {
            console.log(err)
          }
        }

        // we could only check one locale's files (serving as master/template) for speed
        // break
      }

      function getNumberFormatType(v: NumberFormatOptions) {
        if (v.style == null) return 'NumberFormatOptions'

        /**
         * Generating narrowed types may not be desired as types are only updated on save
         */
        // if (v.style === 'currency') return 'CurrencyNumberFormatOptions'
        // if (v.style === 'decimal' || v.style === 'percent') return 'CurrencyNumberFormatOptions'
        return 'NumberFormatOptions'
      }

      return `// generated by @nuxtjs/i18n
import type { DateTimeFormatOptions, NumberFormatOptions, SpecificNumberFormatOptions, CurrencyNumberFormatOptions } from '@intlify/core'

interface GeneratedLocaleMessage {
  ${generateInterface(messages).trim()}
}

interface GeneratedDateTimeFormat {
  ${Object.keys(dateFormats)
    .map(k => `${k}: DateTimeFormatOptions;`)
    .join(`\n  `)}
}

interface GeneratedNumberFormat {
  ${Object.entries(numberFormats)
    .map(([k, v]) => `${k}: ${getNumberFormatType(v as NumberFormatOptions)};`)
    .join(`\n  `)}
}

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends GeneratedLocaleMessage {}
  export interface DefineDateTimeFormat extends GeneratedDateTimeFormat {}
  export interface DefineNumberFormat extends GeneratedNumberFormat {}
}

declare module '@intlify/core' {
  export interface DefineCoreLocaleMessage extends GeneratedLocaleMessage {}
}

export {}`
    }
  })

  // watch locale files for changes and update template
  nuxt.hook('builder:watch', async (_, path) => {
    const paths = nuxt.options._i18n.locales.flatMap(x => x.files.map(f => f.path))
    if (!paths.includes(path) && !vueI18nConfigPaths.some(x => x.absolute.includes(path))) return

    await updateTemplates({ filter: template => template.filename === 'types/i18n-messages.d.ts' })
  })
}
