import { promises as fs } from 'fs'
import { pathToFileURL } from 'url'
import { listen } from 'listhen'
import { resolve } from 'pathe'
import { createCommonJS } from 'mlly'

import type { NitroContext, NitroContextInfo } from './types'
import type { RequestListener } from 'http'
import type { ListenOptions } from 'listhen'

const cjs = createCommonJS(import.meta.url)

export const CONTEXT_INFO_PATH = resolve(cjs.__dirname, './setup/context.json')

const _default = (r: any) => r.default || r // eslint-disable-line @typescript-eslint/no-explicit-any

// FIXME: https://github.com/microsoft/TypeScript/issues/43329
// module: node12 will be replace it
// const _importDynamic = new Function('modulePath', 'return import(modulePath)')
// export function importModule(path: string) {
//   return _importDynamic(pathToFileURL(path).href).then(_default)
// }

export function importModule(path: string) {
  return import(pathToFileURL(path).href)
}

export function fixtureDir(name: string) {
  return resolve(cjs.__dirname, 'fixtures', name)
}

export async function saveNitroContextInfo(info: NitroContextInfo) {
  await fs.writeFile(CONTEXT_INFO_PATH, JSON.stringify(info), 'utf8')
}

export async function readNitroContextInfo() {
  return (await import(CONTEXT_INFO_PATH).then(_default)) as NitroContextInfo
}

export async function removeNitroContextInfo() {
  await fs.unlink(CONTEXT_INFO_PATH)
}

export function getNitroContext() {
  return (globalThis as any).NITRO_CONTEXT as NitroContext // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function startServer(ctx: NitroContext, handle: RequestListener, opts = {} as Partial<ListenOptions>) {
  ctx.server = await listen(handle, opts)
}
