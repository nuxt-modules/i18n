import { provider } from 'std-env'

export let parseSync: typeof import('oxc-parser').parseSync

export async function initParser() {
  parseSync = await (
    provider === 'stackblitz'
      ? (import('@oxc-parser/wasm') as unknown as Promise<typeof import('oxc-parser')>)
      : import('oxc-parser')
  ).then(r => r.parseSync)
}
