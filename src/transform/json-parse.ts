import { createUnplugin } from 'unplugin'
import { STATIC_RESOURCE_RE, readStaticResource } from '../resources'
import { asI18nVirtual } from './utils'

import type { ResolvedI18nContext } from '../context'

const JSON_PARSE_VIRTUAL_PREFIX = '\0i18n-json-parse/'

/**
 * Serves static locale resources as `export default JSON.parse("...")` modules in server builds,
 * skipping bundler AST/sourcemap work over message data (precompiled message ASTs are ~3x raw size).
 * Must resolve before `ResourcePlugin`: both claim the `#nuxt-i18n/<hash>` ids at `enforce: 'pre'`.
 */
export const JsonParseMessagesPlugin = (ctx: ResolvedI18nContext) =>
  createUnplugin(() => {
    const virtualToPath = new Map<string, string>()
    for (const fileMeta of ctx.localeFileMetas) {
      if (STATIC_RESOURCE_RE.test(fileMeta.path)) {
        virtualToPath.set(asI18nVirtual(fileMeta.hash), fileMeta.path)
      }
    }

    return {
      name: 'nuxtjs:i18n-json-parse-messages',
      enforce: 'pre',
      resolveId(id) {
        if (virtualToPath.has(id)) { return JSON_PARSE_VIRTUAL_PREFIX + id }
      },
      loadInclude(id) {
        return id.startsWith(JSON_PARSE_VIRTUAL_PREFIX)
      },
      load(id) {
        const path = virtualToPath.get(id.slice(JSON_PARSE_VIRTUAL_PREFIX.length))!
        this.addWatchFile(path)
        const raw = readStaticResource(ctx, path)
        return {
          code: `export default /* @__PURE__ */ JSON.parse(${JSON.stringify(raw)})`,
          map: { version: 3, sources: [], names: [], mappings: '' },
        }
      },
    }
  })
