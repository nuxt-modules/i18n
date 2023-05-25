import createDebug from 'debug'
import { promises as fs } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { parse as parsePath, resolve, relative, dirname, join } from 'node:path'
import { findStaticImports } from 'mlly'
import { createUnplugin } from 'unplugin'
import { parseQuery, parseURL, withQuery } from 'ufo'
import MagicString from 'magic-string'
import { VIRTUAL_PREFIX_HEX, asVirtualId, getVirtualId } from './utils'
import {
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
  NUXT_I18N_COMPOSABLE_DEFINE_CONFIG,
  NUXT_I18N_BUNDLE_PROXY_ID
} from '../constants'

import type { PrerenderTargets, PrerenderTarget } from '../utils'

export interface ResourceDynamicPluginOptions {
  prerenderTargs: PrerenderTargets
  ssr: boolean
  dev?: boolean
  sourcemap?: boolean
}

type ResourceMapValue = Pick<PrerenderTarget, 'type'> & { ref: string; hash: string; locale?: string; id?: string }
type ResourceMeta = ResourceMapValue & { path: string }

const debug = createDebug('@nuxtjs/i18n:transform:dynamic')

export const ResourceDynamicPlugin = createUnplugin((options: ResourceDynamicPluginOptions) => {
  debug('options', options)

  const resoucesMap = new Map<string, ResourceMapValue>()
  const resourceMeta: Record<string, ResourceMeta> = {}
  // const relativeToSrcDir = (path: string) => relative(options.srcDir, path)

  return {
    name: 'nuxtjs:i18n-resource-dynamic',
    enforce: 'post',

    /*
    resolveId(id, importer) {
      const { pathname, search } = parseURL(decodeURIComponent(getVirtualId(id)))
      const query = parseQuery(search)

      if (pathname === NUXT_I18N_BUNDLE_PROXY_ID) {
        // console.log('nuxtjs:i18n-resource-dynamic resolveId (bundle)', id, importer)
        return {
          id: withQuery(id, query),
          moduleSideEffects: true
        }
      }

      return null
    },

    async load(id) {
      const { pathname, search } = parseURL(decodeURIComponent(getVirtualId(id)))
      const query = parseQuery(search)

      if (pathname === NUXT_I18N_BUNDLE_PROXY_ID) {
        // console.log('nuxtjs:i18n-resource-dynamic load (bundle)', id)
        const hash = query.hash as string
        const s = resoucesMap2.get(hash)
        return {
          code: s?.code
        }
      }
    },
    */

    transformInclude(id) {
      debug('transformInclude', id)

      if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
        return false
      }

      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href))
      const query = parseQuery(search)
      return /\.([c|m]?[j|t]s)$/.test(pathname) && !!query.hash && (!!query.locale || !!query.config)
    },

    transform(code, id) {
      debug('transform', id)

      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href))
      const query = parseQuery(search)
      const hash = query.hash as string

      const s = new MagicString(code)

      function result() {
        if (s.hasChanged()) {
          return {
            code: s.toString(),
            map:
              options.sourcemap && !/\.([c|m]?ts)$/.test(pathname)
                ? s.generateMap({ source: id, includeContent: true })
                : undefined
          }
        }
      }

      const pattern = query.locale ? NUXT_I18N_COMPOSABLE_DEFINE_LOCALE : NUXT_I18N_COMPOSABLE_DEFINE_CONFIG
      const match = code.match(new RegExp(`\\b${pattern}\\s*`))
      if (match?.[0]) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        s.remove(match.index!, match.index! + match[0].length)
      }

      if (!options.dev) {
        const ref = this.emitFile({
          // @ts-expect-error
          type: 'chunk',
          id,
          preserveSignature: 'strict'
        }) as unknown as string

        // const code = result()?.code
        // if (!code) {
        //   return
        // }
        // const ref = this.emitFile({
        //   type: 'asset',
        //   name: `${query.locale ? 'locale' : 'config'}-${hash}.mjs`,
        //   needsCodeReference: true,
        //   source: result()?.code
        // }) as unknown as string

        resoucesMap.set(id, {
          hash,
          id,
          type: query.locale ? 'locale' : 'config',
          locale: query.locale as string,
          ref
        })

        // for (const i of findStaticImports(code)) {
        //   const resolved = await this.resolve(i.specifier, id)
        //   if (!resolved) { continue }
        // }

        // const ref2 = this.emitFile({
        //   // @ts-expect-error
        //   type: 'chunk',
        //   name: `${parsed.name}-${hash}.mjs`,
        //   id: asVirtualId(withQuery(NUXT_I18N_BUNDLE_PROXY_ID, { hash, type: query.locale ? 'locale' : 'config' })),
        //   importer: id
        //   // fileName: `${parsed.name}.mjs`,
        //   // source: result()?.code
        // }) as unknown as string

        // resoucesMap2.set(hash, {
        //   type: query.locale ? 'locale' : 'config',
        //   locale: query.locale as string,
        //   code: result()?.code,
        //   ref: ref2
        // })
      }

      return result()
    },

    vite: {
      renderChunk(_code, chunk, options, meta) {
        const id = chunk.facadeModuleId
        if (id && resoucesMap.has(id)) {
          // console.log('renderChunk: chunk', chunk)
          // console.log('renderChunk: options', options)
          // console.log('renderChunk: meta', meta)
          //  const parsed = parsePath(id)
          // console.log('renderChunk facade', parsed)
          // chunk.fileName = chunk.fileName.substr(0, chunk.fileName.lastIndexOf('.')) + '.mjs'
        }

        return null
      },

      generateBundle(outputOptions) {
        console.log('generateBundle: outputOptions.dir', outputOptions.dir)
        /**
         * NOTE:
         * avoid generating i18n-meta.json for SPA mode,
         * because some i18n resources doesn't bundle on server-side
         */
        if (!options.ssr && outputOptions.dir?.endsWith('server')) {
          return
        }

        const emitted: Record<string, string> = {}
        const assetName = (hash: string, type: PrerenderTarget['type']) => `${type}-${hash}.mjs`

        const meta = [...resoucesMap].reduce((meta, [_, { hash, type, locale, ref }]) => {
          // const name = assetName(hash, type)
          // const importId = `${type}_${hash}`
          // const base =
          //   typeof outputOptions.assetFileNames === 'string'
          //     ? outputOptions.assetFileNames
          //     : outputOptions.assetFileNames({
          //         type: 'asset',
          //         name,
          //         source: ''
          //       })
          // const proxyRef = (emitted[hash] = this.emitFile({
          //   type: 'asset',
          //   name,
          //   source: [
          //     `import ${importId} from './${relative(dirname(base), this.getFileName(ref))}';`,
          //     `export default ${importId};`
          //   ].join('\n')
          // }))
          // obj[hash] = { hash, type, locale, path: this.getFileName(proxyRef) }
          const filename = this.getFileName(ref)
          const parsed = parsePath(filename)
          const destRef = join(parsed.root, parsed.dir, `${parsed.name}.mjs`)
          // meta[hash] = { hash, type, locale, ref: filename, path: destRef }
          meta[hash] = { hash, type, locale, ref: filename, path: destRef }
          return meta
        }, resourceMeta)
        debug('generateBundle: meta', meta)

        this.emitFile({
          type: 'asset',
          fileName: 'i18n-meta.json',
          name: 'i18n-meta.json',
          source: JSON.stringify(meta, null, 2)
        })
      },

      async writeBundle(outputOptions /*, bundle*/) {
        /**
         * NOTE:
         * avoid generating i18n-meta.json for SPA mode,
         * because some i18n resources doesn't bundle on server-side
         */
        if (!options.ssr && outputOptions.dir?.endsWith('server')) {
          return
        }

        for (const [_, { ref, path }] of Object.entries(resourceMeta)) {
          const org = resolve(outputOptions.dir!, ref)
          const dest = resolve(outputOptions.dir!, path)
          console.log('copy:', _, org, dest)
          await fs.copyFile(org, dest)
        }
      }
    }
  }
})
