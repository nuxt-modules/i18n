import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  // TODO: when this mobulde will be built with unbuild on workspace, so the building is failed ...
  externals: [
    '@nuxt/schema',
    '@nuxtjs/i18n',
    'defu',
    'std-env',
    'pathe',
    'create-require',
    'scule',
    'lodash.merge',
    'jiti',
    '@babel/parse',
    '@babel/traverse',
    'cookie',
    'js-cookie',
    'ufo',
    '@intlify/vue-i18n-extensions',
    '@intlify/vue-i18n-bridge',
    'webpack'
  ]
})
