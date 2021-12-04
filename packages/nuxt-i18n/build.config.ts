import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: true,
  emitCJS: false,
  entries: [
    './src/module',
    {
      input: 'src/runtime/',
      outDir: 'dist/runtime',
      format: 'esm',
      declaration: true
    }
  ],
  externals: [
    '@nuxt/schema',
    'defu',
    'std-env',
    'create-require',
    'scule',
    'jiti'
  ]
})
