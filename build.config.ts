import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  externals: [
    'node:fs',
    'node:url',
    'webpack',
    '@babel/parser',
    'unplugin-vue-router',
    'unplugin-vue-router/options',
    'jiti',
    'confbox',
    'ofetch',
    'destr'
  ],
  failOnWarn: false
})
