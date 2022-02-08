import { loadModule } from './utils.mjs'
;(async () => {
  const Vue = loadModule('vue')
  if (Vue && Vue.version.startsWith('2.')) {
    const { switchVersion } = loadModule('@intlify/vue-i18n-bridge/scripts/utils.js')
    switchVersion(8, 'vue-i18n-legacy')
  }
})()
