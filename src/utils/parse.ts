export let parseSync: typeof import('oxc-parser').parseSync
type ParseSyncParams = Parameters<typeof parseSync>

export async function initParser() {
  try {
    parseSync = await import('oxc-parser').then(r => r.parseSync)
  } catch (_) {
    console.warn('[nuxt-i18n]: Unable to import `oxc-parser`, falling back to `@oxc-parser/wasm`.')

    const { parseSync: parser } = await import('@oxc-parser/wasm')
    // @ts-expect-error sourceType property conflict
    parseSync = (filename, sourceText, options?: ParseSyncParams[2]) =>
      // @ts-expect-error sourceType property conflict
      parser(sourceText, { ...(options || {}), sourceFilename: filename })
  }
}
