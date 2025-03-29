import { beforeAll, describe } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setTestContext, setup, useTestContext } from './utils'
import { basicUsageTests } from './basic-usage-tests'
import { startServerWithRuntimeConfig } from './helper'
import { languageSwitchingTests } from './language-switching-tests'

describe('basic usage - compatibilityVersion: 4', async () => {
  await setup({
    rootDir: fileURLToPath(new URL(`./fixtures/basic_usage_compat_4`, import.meta.url)),
    browser: true,
    // overrides
    nuxtConfig: {
      runtimeConfig: {
        public: {
          i18n: {
            baseUrl: 'http://localhost:3000',
            skipSettingLocaleOnNavigate: undefined,
            detectBrowserLanguage: undefined,
            experimental: {
              alternateLinkCanonicalQueries: false
            }
          }
        }
      }
    }
  })

  let ctx
  describe('general usage', async () => {
    basicUsageTests()
    ctx = useTestContext()
  })

  describe('language switching', async () => {
    beforeAll(async () => {
      setTestContext(ctx)
      await startServerWithRuntimeConfig({
        public: {
          i18n: {
            skipSettingLocaleOnNavigate: true,
            detectBrowserLanguage: false
          }
        }
      })
    })

    languageSwitchingTests()
  })
})
