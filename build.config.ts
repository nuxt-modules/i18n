import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/module'],
  externals: ['node:fs', 'node:url', 'webpack', '@babel/parser', 'unplugin-vue-router', 'unplugin-vue-router/options']
})
