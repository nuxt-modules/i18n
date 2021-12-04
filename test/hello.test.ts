/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { assert } from 'chai'
import { resolve } from 'pathe'
import { startServer, importModule } from './utils'
import { $fetch } from 'ohmyfetch'

import type { NitroContext } from './types'

async function getHandler(ctx: NitroContext) {
  const { handle } = await importModule(
    resolve(ctx.outDir!, 'server/index.mjs')
  )
  await startServer(ctx, handle, { showURL: true })
  return async ({ url }: { url: string }) => {
    const data = await ctx.fetch!(url)
    return {
      data
    }
  }
}

describe('build', function () {
  let ctx: NitroContext | null = null
  let handler = null

  before(async function () {
    ctx = (globalThis as any).NITRO_CXT as NitroContext // eslint-disable-line @typescript-eslint/no-explicit-any
    ctx.fetch = (url: string) => $fetch(url, { baseURL: ctx!.server!.url })
    handler = await getHandler(ctx)
  })

  after(async function () {
    ctx!.server && (await ctx!.server.close())
  })

  it('home', async function () {
    await ctx!.page?.goto('http://localhost:3000/')
    console.log(await ctx!.page?.content())
  })
})

/* eslint-enable @typescript-eslint/no-non-null-assertion */
