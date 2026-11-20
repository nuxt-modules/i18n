import { createTestContext, setTestContext } from '../context'
import { buildFixture, loadFixture } from '../nuxt'
import { startServer, stopServer } from '../server'
import { createBrowser } from '../browser'
import setupVitest from './vitest'
import consola from 'consola'
import { appendFileSync } from 'node:fs'

// temporary: phase timings for the CI measurement, written when `PHASE_OUT` names a file
const record = (file: string, name: string, since: number) => {
  if (process.env.PHASE_OUT) {
    appendFileSync(process.env.PHASE_OUT, `${file}\t${name}\t${Math.round(performance.now() - since)}\n`)
  }
}
const phase = async (file: string, name: string, fn: () => unknown) => {
  const start = performance.now()
  await fn()
  record(file, name, start)
}

import type { TestContext, TestHooks, TestOptions, VitestContext } from '../types'

const activeContexts = new Set<TestContext>()
let processCleanupRegistered = false

function registerProcessCleanup() {
  if (processCleanupRegistered) return
  processCleanupRegistered = true

  const cleanup = () => {
    for (const ctx of activeContexts) {
      try {
        setTestContext(ctx)
        stopServer()
      } catch {
        // best-effort: cleanup must not throw on exit
      } finally {
        setTestContext(undefined)
      }
    }
    activeContexts.clear()
  }

  process.once('exit', cleanup)
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
    process.once(signal, () => {
      cleanup()
      process.exit(signal === 'SIGINT' ? 130 : 1)
    })
  }
}

function createTest(options: Partial<TestOptions>): TestHooks {
  const ctx = createTestContext(options)
  registerProcessCleanup()
  activeContexts.add(ctx)

  const beforeEach = () => {
    setTestContext(ctx)
    if (!process.env.CI) {
      consola.restoreConsole()
    }
  }

  const afterEach = () => {
    setTestContext(undefined)
  }

  let file = 'unknown'
  let ready = performance.now()

  const afterAll = async () => {
    record(file, 'tests', ready)
    const start = performance.now()

    await phase(file, 'teardown: server', () => {
      if (ctx.serverProcess || ctx.staticServers) {
        setTestContext(ctx)
        stopServer()
        setTestContext(undefined)
      }
    })

    activeContexts.delete(ctx)

    if (ctx.nuxt && ctx.nuxt.options.dev) {
      await ctx.nuxt.close()
    }

    await phase(file, 'teardown: browser', async () => {
      if (ctx.browser) {
        await ctx.browser.close()
      }
    })

    if (ctx.teardown) {
      await Promise.all(ctx.teardown.map(fn => fn()))
    }
    record(file, 'teardown', start)
  }

  const setup = async (testContext: VitestContext) => {
    // @ts-ignore the suite or file this hook runs for
    file = String(testContext?.file?.name ?? testContext?.name ?? 'unknown')

    if (ctx.options.fixture) {
      await phase(file, 'load', () => loadFixture(testContext))
    }

    if (ctx.options.build) {
      await phase(file, 'build', () => buildFixture())
    }

    if (ctx.options.server) {
      await phase(file, 'server', () => startServer())
    }

    if (ctx.options.waitFor) {
      await new Promise(resolve => setTimeout(resolve, ctx.options.waitFor))
    }

    if (ctx.options.browser) {
      await phase(file, 'browser', () => createBrowser())
    }
    ready = performance.now()
  }

  return {
    beforeEach,
    afterEach,
    afterAll,
    setup,
    ctx
  }
}

export async function setup(options: Partial<TestOptions> = {}) {
  // Our layer support handles each layer individually (ignoring merged options)
  // `nuxtConfig` overrides are not applied to `_layers` but passed to merged options
  // `i18n.overrides` are applied at project layer to support overrides from tests

  // @ts-ignore
  if (options?.nuxtConfig?.i18n != null) {
    // @ts-ignore
    options.nuxtConfig.i18n = { ...options.nuxtConfig.i18n, overrides: options.nuxtConfig.i18n }
  }

  const hooks = createTest(options)
  await setupVitest(hooks)
}
