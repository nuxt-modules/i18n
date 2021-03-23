import Vue from 'vue'
import { nuxtI18nHead } from './head-meta'

/** @type {Vue.PluginObject<void>} */
const plugin = {
  install (Vue) {
    Vue.mixin({
      head () {
        return nuxtI18nHead.call(this, { addDirAttribute: false, addSeoAttributes: true })
      }
    })
  }
}

Vue.use(plugin)
