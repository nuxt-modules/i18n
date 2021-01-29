import Vue from 'vue'
import { nuxtI18nSeo } from './head-meta'

const plugin = {
  install (Vue) {
    Vue.mixin({
      head: nuxtI18nSeo
    })
  }
}

Vue.use(plugin)
