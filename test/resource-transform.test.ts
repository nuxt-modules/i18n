import { describe, it, expect } from 'vitest'
import { ResourcePlugin } from '../src/transform/resource'

import type { ResolvedI18nContext } from '../src/context'

function createPlugin(paths: string[]) {
  const ctx = {
    localeFileMetas: paths.map(path => ({ path, hash: path })),
    vueI18nConfigPaths: []
  } as unknown as ResolvedI18nContext
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ResourcePlugin({ sourcemap: false }, ctx).raw({}, { framework: 'vite' } as any) as any
}

async function transform(code: string, id: string) {
  const plugin = createPlugin([id])
  const res = await plugin.transform.handler(code, id)
  return res?.code
}

describe('ResourcePlugin', () => {
  it('unwraps `defineI18nLocale` calls', async () => {
    const code = `export default defineI18nLocale(() => ({ msg: 'English message' }))`

    expect(await transform(code, '/app/i18n/locales/en.js')).toEqual(`export default () => ({ msg: 'English message' })`)
  })

  // explicit imports are used when the nuxt `imports.autoImport` option is disabled (#2151)
  it('unwraps `defineI18nLocale` when explicitly imported', async () => {
    const code = `import { defineI18nLocale } from '#i18n'

export default defineI18nLocale(() => ({
  msg: 'English message'
}))
`

    expect(await transform(code, '/app/i18n/locales/en.js')).toMatchInlineSnapshot(`
      "import { defineI18nLocale } from '#i18n'

      export default () => ({
        msg: 'English message'
      })
      "
    `)
  })

  it('unwraps `defineI18nConfig` when explicitly imported', async () => {
    const code = `import { defineI18nConfig } from '#i18n'

export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en'
}))
`

    expect(await transform(code, '/app/i18n/i18n.config.ts')).toMatchInlineSnapshot(`
      "import { defineI18nConfig } from "#i18n";
      export default () => ({
      	legacy: false,
      	fallbackLocale: "en"
      });
      "
    `)
  })
})
