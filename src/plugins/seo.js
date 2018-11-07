import Vue from 'vue'
import { nuxtI18nSeo } from '~/modules/nuxt-i18n/src/utils/seo'

Vue.mixin({
  head () {
    return nuxtI18nSeo.bind(this)()
  }
})
