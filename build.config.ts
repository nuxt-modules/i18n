import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  externals: ['node:fs', 'node:url', '@intlify/vue-i18n-bridge', 'webpack']
})
