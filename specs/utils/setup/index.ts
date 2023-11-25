import { createTestContext, setTestContext } from '../context'
import { buildFixture, loadFixture } from '../nuxt'
import { startServer, stopServer } from '../server'
import { createBrowser } from '../browser'
import setupJest from './jest'
import setupVitest from './vitest'
import consola from 'consola'

import type { TestHooks, TestOptions, VitestContext } from '../types'

export const setupMaps = {
  jest: setupJest,
  vitest: setupVitest
}

export function createTest(options: Partial<TestOptions>): TestHooks {
  const ctx = createTestContext(options)

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
    if (ctx.serverProcess) {
      setTestContext(ctx)
      await stopServer()
      setTestContext(undefined)
    }

    if (ctx.nuxt && ctx.nuxt.options.dev) {
      await ctx.nuxt.close()
    }

    if (ctx.browser) {
      await ctx.browser.close()
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

  const setupFn = setupMaps[hooks.ctx.options.runner]

  await setupFn(hooks)
}
