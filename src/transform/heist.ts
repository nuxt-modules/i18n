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
      handler(code) {
        const s = new MagicString(code)

        for (const statement of parseSync('', code, { lang: 'js' }).program.body) {
          if (statement.type !== 'ImportDeclaration' || statement.source.value !== '#imports') { continue }

          const runtimeConfigImports = statement.specifiers.filter(
            specifier => specifier.type === 'ImportSpecifier'
              && specifier.imported.type === 'Identifier'
              && specifier.imported.name === 'useRuntimeConfig',
          )
          if (!runtimeConfigImports.length) { continue }

          const remaining = statement.specifiers.filter(specifier => !runtimeConfigImports.includes(specifier))
          const defaultImport = remaining.find(specifier => specifier.type === 'ImportDefaultSpecifier')
          const namespaceImport = remaining.find(specifier => specifier.type === 'ImportNamespaceSpecifier')
          const namedImports = remaining
            .filter(specifier => specifier.type === 'ImportSpecifier')
            .map((specifier) => {
              const name = specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value
              return name === specifier.local.name ? name : `${name} as ${specifier.local.name}`
            })
          const remainingImports = [
            defaultImport?.local.name,
            namespaceImport && `* as ${namespaceImport.local.name}`,
            namedImports.length && `{ ${namedImports.join(', ')} }`,
          ].filter(Boolean)
          const runtimeConfigSpecifiers = runtimeConfigImports.map(specifier =>
            specifier.local.name === 'useRuntimeConfig'
              ? 'useRuntimeConfig'
              : `useRuntimeConfig as ${specifier.local.name}`,
          )
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
