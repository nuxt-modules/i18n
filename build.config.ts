import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  externals: ['node:fs', '@intlify/vue-i18n-bridge', 'webpack']
})
