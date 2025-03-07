// Adapted from https://github.com/nuxt/nuxt/blob/6d85c15fb1783b003bb5d7cdefdd22b54f871f9d/packages/nuxt/src/core/utils/parse.ts

export let parseSync: typeof import('oxc-parser').parseSync

export async function initParser() {
  try {
    parseSync = await import('oxc-parser').then(r => r.parseSync)
  } catch (_) {
    console.warn('[nuxt-i18n]: Unable to import `oxc-parser`, falling back to `@oxc-parser/wasm`.')

    const { parseSync: parse } = await import('@oxc-parser/wasm')
    parseSync = (filename, sourceText, options) =>
      // @ts-expect-error sourceType property conflict
      parse(sourceText, {
        ...(options || {}),
        sourceFilename: filename.replace(/\?.*$/, '') + `.${options?.lang || 'ts'}`,
        sourceType: 'module'
      })
  }
}
