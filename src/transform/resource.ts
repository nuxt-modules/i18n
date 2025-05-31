import MagicString from 'magic-string'
import { createUnplugin } from 'unplugin'
import { asI18nVirtual, VIRTUAL_PREFIX_HEX } from './utils'
import {
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
  NUXT_I18N_COMPOSABLE_DEFINE_CONFIG,
  NUXT_I18N_VIRTUAL_PREFIX
} from '../constants'
import { resolve, dirname } from 'pathe'
import { findStaticImports } from 'mlly'
import { resolvePath, tryUseNuxt } from '@nuxt/kit'
import { transform as esbuildTransform } from 'esbuild'
import type { SameShape, TransformOptions, TransformResult } from 'esbuild'

import type { BundlerPluginOptions } from './utils'
import type { I18nNuxtContext } from '../context'

async function transform<T extends TransformOptions>(
  input: string | Uint8Array,
  options?: SameShape<TransformOptions, T>
): Promise<TransformResult<T>> {
  return await esbuildTransform(input, { ...tryUseNuxt()?.options.esbuild?.options, ...options })
}

const pattern = [NUXT_I18N_COMPOSABLE_DEFINE_LOCALE, NUXT_I18N_COMPOSABLE_DEFINE_CONFIG].join('|')
const DEFINE_I18N_FN_RE = new RegExp(`\\b(${pattern})\\s*\\((.+)\\s*\\)`, 'gms')

export const ResourcePlugin = (options: BundlerPluginOptions, ctx: I18nNuxtContext) =>
  createUnplugin(() => {
    // TODO: track all i18n files found in configuration
    const i18nFileMetas = [...ctx.localeInfo.flatMap(x => x.meta), ...ctx.vueI18nConfigPaths]
    const i18nPathSet = new Set<string>()
    const i18nFileHashSet = new Map<string, string>()
    for (const meta of i18nFileMetas) {
      if (i18nPathSet.has(meta.path)) continue
      i18nPathSet.add(meta.path)
      i18nFileHashSet.set(asI18nVirtual(meta.hash), meta.path)
    }

    return {
      name: 'nuxtjs:i18n-resource',
      enforce: 'pre',

      // resolve virtual hash to file path
      resolveId(id) {
        if (!id || id.startsWith(VIRTUAL_PREFIX_HEX) || !id.startsWith(NUXT_I18N_VIRTUAL_PREFIX)) {
          return
        }

        if (i18nFileHashSet.has(id)) {
          return i18nFileHashSet.get(id)
        }
      },

      transformInclude(id) {
        if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
          return false
        }

        if (i18nPathSet.has(id)) {
          return /\.([c|m]?[j|t]s)$/.test(id)
        }
      },

      /**
       * Match and replace `defineI18nX(<content>)` with its `<content>`
       */
      transform: {
        filter: {
          id: {
            include: [...i18nPathSet]
          }
        },
        async handler(_code, id) {
          let code = _code

          // ensure imported resources are transformed as well
          const staticImports = findStaticImports(_code)
          for (const x of staticImports) {
            if (x.specifier.startsWith('\0')) continue
            i18nPathSet.add(await resolvePath(resolve(dirname(id), x.specifier)))
          }

          // transform typescript
          if (/(c|m)?ts$/.test(id)) {
            code = (await transform(_code, { loader: 'ts' })).code
          }

          const s = new MagicString(code)
          const matches = code.matchAll(DEFINE_I18N_FN_RE)
          for (const match of matches) {
            s.overwrite(match.index, match.index + match[0].length, match[2])
          }

          if (s.hasChanged()) {
            return {
              code: s.toString(),
              map: options.sourcemap && !/\.([c|m]?ts)$/.test(id) ? s.generateMap({ hires: true }) : null
            }
          }
        }
      }
    }
  })
