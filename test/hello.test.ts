import { describe, beforeAll, afterAll, test } from 'vitest'
import { resolve } from 'pathe'
import { startServer, importModule, getNitroContext } from './utils'
import { $fetch } from 'ohmyfetch'

import type { NitroContext } from './types'

async function getHandler(ctx: NitroContext) {
  const { handle } = await importModule(resolve(ctx.outDir!, 'server/index.mjs'))
  await startServer(ctx, handle, { showURL: true })
  return async ({ url }: { url: string }) => {
    const data = await ctx.fetch!(url)
    return { data }
  }
}

describe('build', () => {
  let ctx: NitroContext | null = null
  let handler = null

  beforeAll(async () => {
    ctx = getNitroContext()
    ctx.fetch = (url: string) => $fetch(url, { baseURL: ctx!.server!.url })
    handler = await getHandler(ctx)
  })

  afterAll(async () => {
    ctx!.server && (await ctx!.server.close())
  })

  test('home', async () => {
    await ctx!.page?.goto('http://localhost:3000/')
    console.log(await ctx!.page?.content())
  })
})
