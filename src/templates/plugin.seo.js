import Vue from 'vue'
import { nuxtI18nSeo } from './head-meta'

const plugin = {
  install (Vue) {
    if (!Vue.__nuxtI18nSeo__) {
      Vue.__nuxtI18nSeo__ = true
      Vue.mixin({
        head: nuxtI18nSeo
      })
    }
  }
}

Vue.use(plugin)
