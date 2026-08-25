import MagicString from 'magic-string'
import { parseSync } from 'oxc-parser'
import { createUnplugin } from 'unplugin'

import type { BundlerPluginOptions } from './utils'
import type { ResolvedI18nContext } from '../context'
import { relative } from 'pathe'
import { useNuxt } from '@nuxt/kit'

/**
 * Swap out impounded logic where vue/nuxt aliases are not available and not needed
 * - replaces "#app" import with a mock variable definition
 * - replaces `useNuxtApp()` with the mock variable
 */
export const HeistPlugin = (options: BundlerPluginOptions, ctx: ResolvedI18nContext, nuxt = useNuxt()) => {
  // transform `runtime/shared` to be nuxt/nitro context agnostic
  const shared = ctx.resolver.resolve(ctx.distDir, 'runtime/shared/*')

  const replacementName = `__nuxtMock`
  const replacementMock = `const ${replacementName} = { runWithContext: async (fn) => await fn() };`
  const resources = ['i18n-route-resources.mjs', 'i18n-options.mjs']

  return createUnplugin(() => ({
    name: 'nuxtjs:i18n-heist',
    enforce: 'pre',
    transform: {
      filter: {
        id: [shared, relative(nuxt.options.rootDir, shared)],
      },
      handler(code, id) {
        const s = new MagicString(code)

        for (const statement of parseSync(id, code).program.body) {
          if (
            statement.type !== 'ImportDeclaration'
            || statement.source.value !== '#imports'
            || statement.importKind === 'type'
          ) { continue }

          const runtimeConfigImports = statement.specifiers.filter(
            specifier => specifier.type === 'ImportSpecifier'
              && specifier.imported.type === 'Identifier'
              && specifier.imported.name === 'useRuntimeConfig'
              && specifier.importKind !== 'type',
          )
          if (!runtimeConfigImports.length) { continue }

          const remaining = statement.specifiers.filter(specifier => !runtimeConfigImports.includes(specifier))
          const defaultImport = remaining.find(specifier => specifier.type === 'ImportDefaultSpecifier')
          const namespaceImport = remaining.find(specifier => specifier.type === 'ImportNamespaceSpecifier')
          const namedImports = remaining.filter(specifier => specifier.type === 'ImportSpecifier')
          const remainingImports = [
            defaultImport && code.slice(defaultImport.start, defaultImport.end),
            namespaceImport && code.slice(namespaceImport.start, namespaceImport.end),
            namedImports.length && `{ ${namedImports.map(specifier => code.slice(specifier.start, specifier.end)).join(', ')} }`,
          ].filter(Boolean)
          const runtimeConfigSpecifiers = runtimeConfigImports.map(specifier => code.slice(specifier.start, specifier.end))
          const replacement = [
            remainingImports.length && `import ${remainingImports.join(', ')} from '#imports'`,
            `import { ${runtimeConfigSpecifiers.join(', ')} } from '#internal/i18n-nitro.mjs'`,
          ].filter(Boolean).join('\n')

          s.overwrite(statement.start, statement.end, replacement)
        }
        s.replaceAll('#build/i18n-h3.mjs', '#internal/i18n-nitro.mjs')

        // replace `#app` import with a mock variable definition
        s.replace(/import.+["']#app["'];?/, replacementMock)

        // replace `#app` with `__nuxtMock`
        s.replaceAll(/useNuxtApp\(\)/g, replacementName)

        for (const resource of resources) {
          s.replaceAll(new RegExp(`#build/${resource}`, 'g'), `#internal/${resource}`)
        }

        return {
          code: s.toString(),
          map: options.sourcemap ? s.generateMap({ hires: true }) : undefined,
        }
      },
    },
  }))
}
