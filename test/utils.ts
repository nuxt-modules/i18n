import { pathToFileURL } from 'url'
import { listen } from 'listhen'
import { resolve } from 'pathe'
import { createCommonJS } from 'mlly'

import type { NitroContext } from './types'
import type { RequestListener } from 'http'
import type { ListenOptions } from 'listhen'

const _default = (r: any) => r.default || r // eslint-disable-line @typescript-eslint/no-explicit-any
// FIXME: https://github.com/microsoft/TypeScript/issues/43329
// module: node12 will be replace it
const _importDynamic = new Function('modulePath', 'return import(modulePath)')
const cjs = createCommonJS(import.meta.url)

export function importModule(path: string) {
  return _importDynamic(pathToFileURL(path).href).then(_default)
}

export function fixtureDir(name: string) {
  return resolve(cjs.__dirname, 'fixtures', name)
}

export async function startServer(
  ctx: NitroContext,
  handle: RequestListener,
  opts = {} as Partial<ListenOptions>
) {
  ctx.server = await listen(handle, opts)
}
