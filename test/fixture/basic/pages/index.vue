<template>
  <div>
    <LangSwitcher />
    <div id="current-page">page: {{ $t('home') }}</div>
    <nuxt-link id="link-about" exact :to="aboutPath">{{ aboutTranslation }}</nuxt-link>
    <div id="current-locale">locale: {{ $i18n.locale }}</div>
    <div id="message-function">{{ $t('fn') }}</div>
    <div id="english-translation">{{ $t('home', 'en') }}</div>
  </div>
</template>

<script>
import Vue from 'vue'
import LangSwitcher from '../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  },
  asyncData ({ localePath, i18n }) {
    return {
      aboutPath: localePath('about'),
      aboutTranslation: i18n.t('about')
    }
  },
  data () {
    return {
      aboutPath: '',
      aboutTranslation: ''
    }
  },
  /** @return {import('vue-meta').MetaInfo} */
  head () {
    return {
      ...this.$nuxtI18nHead({ addDirAttribute: false }),
      title: String(this.$t('home'))
    }
  },
  created () {
    // This tests the case where klona tries to clone reactive object instead of an original one.
    // https://github.com/nuxt-community/i18n-module/issues/1075
    Vue.observable(this.$i18n.locales)
  }
}
</script>
