import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  externals: ['node:fs', 'node:url', 'webpack', '@babel/parser']
})
