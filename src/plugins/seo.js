import Vue from 'vue'
import { nuxtI18nSeo } from './seo-head'

const plugin = {
  install (Vue) {
    Vue.mixin({
      head: nuxtI18nSeo
    })
  }
}

Vue.use(plugin)
