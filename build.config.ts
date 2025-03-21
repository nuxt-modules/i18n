import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/module'],
  externals: [
    'node:fs',
    'node:url',
    'webpack',
    '@rspack/core',
    'oxc-parser',
    '@babel/parser',
    'unplugin-vue-router',
    'unplugin-vue-router/options'
  ]
})
