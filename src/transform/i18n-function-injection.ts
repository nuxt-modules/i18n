/**
 * This code is adapted from the composable keys transformation in Nuxt:
 * - original code url: https://github.com/nuxt/nuxt/blob/a80d1a0d6349bf1003666fc79a513c0d7370c931/packages/vite/src/plugins/composable-keys.ts
 * - author: Nuxt Framework Team
 * - license: MIT
 */

import MagicString from 'magic-string'
import { ScopeTracker, parseAndWalk, walk } from 'oxc-walker'
import { createUnplugin } from 'unplugin'
import { isVue } from './utils'
import type { BundlerPluginOptions } from './utils'

const TRANSLATION_FUNCTIONS = ['$t', '$rt', '$d', '$n', '$tm', '$te']
const TRANSLATION_FUNCTIONS_RE = /\$([tdn]|rt|tm|te)\s*\(\s*/
const TRANSLATION_FUNCTIONS_MAP: Record<(typeof TRANSLATION_FUNCTIONS)[number], string> = {
  $t: 't: $t',
  $rt: 'rt: $rt',
  $d: 'd: $d',
  $n: 'n: $n',
  $tm: 'tm: $tm',
  $te: 'te: $te',
}

const QUERY_RE = /\?.*$/

function withoutQuery(id: string) {
  return id.replace(QUERY_RE, '')
}

export const TransformI18nFunctionPlugin = (options: BundlerPluginOptions) =>
  createUnplugin(() => {
    return {
      name: 'nuxtjs:i18n-function-injection',
      enforce: 'pre',

      transformInclude(id) {
        return isVue(id, { type: ['script'] })
      },

      transform: {
        filter: {
          code: { include: TRANSLATION_FUNCTIONS_RE },
        },
        handler(code, id) {
          const script = extractScriptSetupContent(code)
          if (!script) { return }

          // replace .vue extension with .ts or .tsx
          const filepath = withoutQuery(id).replace(/\.\w+$/, '.' + script.loader)
          const missing = collectMissingI18nFunctions(script.code, filepath)
          if (!missing.size) { return }

          // only add variables when used without having been declared
          const assignments: string[] = []
          for (const entry of missing) {
            assignments.push(TRANSLATION_FUNCTIONS_MAP[entry]!)
          }

          // add variable declaration at the start of <script>, `autoImports` does the rest
          const s = new MagicString(code)
          s.appendLeft(script.start, `\nconst { ${assignments.join(', ')} } = useI18n()\n`)

          return {
            code: s.toString(),
            map: options.sourcemap ? s.generateMap({ hires: true }) : undefined,
          }
        },
      },
    }
  })

export function collectMissingI18nFunctions(script: string, id: string) {
  // pre-pass to collect all declarations
  const scopeTracker = new ScopeTracker({ preserveExitedScopes: true })
  const ast = parseAndWalk(script, id, { scopeTracker })

  const missing = new Set<string>()
  walk(ast.program, {
    scopeTracker,
    enter(node) {
      if (node.type !== 'CallExpression' || node.callee.type !== 'Identifier') { return }
      const name = node.callee.name
      // check if function is used without having been declared
      if (!name || !TRANSLATION_FUNCTIONS.includes(name) || scopeTracker.isDeclared(name)) { return }

      missing.add(name)
    },
  })

  return missing
}

// from https://github.com/nuxt/nuxt/blob/a80d1a0d6349bf1003666fc79a513c0d7370c931/packages/nuxt/src/pages/utils.ts#L138-L147
const SFC_SCRIPT_COMPLEX_RE = /<script(?<attrs>[^>]*)>(?<content>[\s\S]*?)<\/script[^>]*>/i
function extractScriptSetupContent(sfc: string) {
  const match = sfc.match(SFC_SCRIPT_COMPLEX_RE)
  if (match?.groups?.content && match.groups.attrs && match.groups.attrs.includes('setup')) {
    return {
      code: match.groups.content.trim(),
      loader: match.groups.attrs && /[tj]sx/.test(match.groups.attrs) ? 'tsx' : 'ts',
      start: sfc.indexOf(match.groups.content),
    }
  }
}
