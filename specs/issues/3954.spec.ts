import { test, expect, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import ts from 'typescript'
import { setup, useTestContext } from '../utils'

const rootDir = fileURLToPath(new URL('../fixtures/issues/3954', import.meta.url))

await setup({
  rootDir,
  browser: false,
})

function getTypeDiagnostics(source: string) {
  const { nuxt } = useTestContext()
  const buildDir = nuxt!.options.buildDir
  const tempDir = mkdtempSync(join(tmpdir(), 'nuxt-i18n-3954-'))
  const testFile = join(tempDir, 'issue-3954.ts')
  writeFileSync(testFile, source)

  try {
    const rootNames = [
      resolve(buildDir, 'types/typed-router.d.ts'),
      resolve(buildDir, 'types/typed-router-i18n.d.ts'),
      resolve(buildDir, 'types/i18n-generated-route-types.d.ts'),
      resolve(buildDir, 'types/i18n-plugin.d.ts'),
      testFile,
    ]

    const program = ts.createProgram(rootNames, {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ESNext,
      types: [],
      lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
    })

    return ts.getPreEmitDiagnostics(program)
      .filter(diagnostic => diagnostic.file?.fileName === testFile)
      .map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

describe('#3954 - typed route regression', () => {
  test('keeps route params narrowed when typed pages are localized', () => {
    const diagnostics = getTypeDiagnostics(`
      import { useRoute } from 'vue-router'

      const route = useRoute()
      const widgetId: string = route.params.widgetId
    `)

    expect(diagnostics).toEqual([])
  })

  test('does not expand RouteLocationRaw into an unrepresentable i18n route union', () => {
    const diagnostics = getTypeDiagnostics(`
      import type { RouteLocationRaw } from 'vue-router'

      interface MyLinkProps {
        to?: RouteLocationRaw
        variant?: 'primary' | 'secondary'
        disabled?: boolean
      }

      declare function defineProps<T>(): T
      defineProps<MyLinkProps & { label?: string }>()
    `)

    expect(diagnostics).toEqual([])
  })
})
