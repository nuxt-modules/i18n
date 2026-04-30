import { createTestContext, setTestContext } from '../context'
import { buildFixture, loadFixture } from '../nuxt'
import { startServer, stopServer } from '../server'
import { createBrowser } from '../browser'
import setupVitest from './vitest'
import consola from 'consola'

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

  const afterAll = async () => {
    if (ctx.serverProcess || ctx.staticServers) {
      setTestContext(ctx)
      stopServer()
      setTestContext(undefined)
    }

    activeContexts.delete(ctx)

    if (ctx.nuxt && ctx.nuxt.options.dev) {
      await ctx.nuxt.close()
    }

    if (ctx.browser) {
      await ctx.browser.close()
    }

    if (ctx.teardown) {
      await Promise.all(ctx.teardown.map(fn => fn()))
    }
  }

  const setup = async (testContext: VitestContext) => {
    if (ctx.options.fixture) {
      await loadFixture(testContext)
    }

    if (ctx.options.build) {
      await buildFixture()
    }

    if (ctx.options.server) {
      await startServer()
    }

    if (ctx.options.waitFor) {
      await new Promise(resolve => setTimeout(resolve, ctx.options.waitFor))
    }

    if (ctx.options.browser) {
      await createBrowser()
    }
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
